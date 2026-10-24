"""
GestureDeck - Gesture Classifier Training & Evaluation Pipeline
Trains a high-performance Multilayer Perceptron (MLP) on 21 normalized 3D hand landmarks.
Generates comprehensive evaluation metrics, confusion matrix, and exports for browser deployment.
"""

import os
import json
import time
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.neural_network import MLPClassifier
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score, precision_recall_fscore_support
import pickle

from dataset_schema import FEATURE_COLUMNS, GESTURE_CLASSES, CLASS_TO_INDEX, INDEX_TO_CLASS


def train_and_evaluate(
    data_path: str = "ml/data/gestures_dataset.csv",
    models_dir: str = "ml/models",
    reports_dir: str = "ml/reports",
    tfjs_export_dir: str = "apps/web/public/models/gesture_classifier"
):
    os.makedirs(models_dir, exist_ok=True)
    os.makedirs(reports_dir, exist_ok=True)
    os.makedirs(tfjs_export_dir, exist_ok=True)

    print("=" * 60)
    print(" GESTUREDECK ML PIPELINE: MODEL TRAINING & BENCHMARKING")
    print("=" * 60)

    # 1. Load dataset
    print(f"\n[1/5] Loading landmark dataset from: {data_path}")
    df = pd.read_csv(data_path)
    print(f"      Total samples: {len(df)} across {df['gesture_label'].nunique()} gesture classes.")

    X = df[FEATURE_COLUMNS].values
    y = df["gesture_label"].map(CLASS_TO_INDEX).values
    lighting = df["lighting_condition"].values

    # 2. Train-Test Split (80% Train, 20% Test, Stratified)
    print("\n[2/5] Performing stratified 80/20 train-test split...")
    X_train, X_test, y_train, y_test, light_train, light_test = train_test_split(
        X, y, lighting, test_size=0.20, random_state=42, stratify=y
    )

    print(f"      Train samples: {len(X_train)}")
    print(f"      Test samples:  {len(X_test)}")

    # 3. Model Architecture & Training
    print("\n[3/5] Training Multilayer Perceptron (MLP: 63 -> 128 -> 64 -> 8)...")
    start_train_time = time.time()

    mlp = MLPClassifier(
        hidden_layer_sizes=(128, 64),
        activation="relu",
        solver="adam",
        learning_rate_init=0.003,
        max_iter=150,
        early_stopping=True,
        validation_fraction=0.15,
        random_state=42,
        verbose=False
    )

    mlp.fit(X_train, y_train)
    training_duration = time.time() - start_train_time
    print(f"      Training converged in {mlp.n_iter_} iterations ({training_duration:.2f}s)")

    # 4. Evaluation & Metrics
    print("\n[4/5] Evaluating performance on held-out test set...")
    y_pred = mlp.predict(X_test)
    y_prob = mlp.predict_proba(X_test)

    acc = accuracy_score(y_test, y_pred)
    prec, rec, f1, _ = precision_recall_fscore_support(y_test, y_pred, average="weighted")
    cm = confusion_matrix(y_test, y_pred)

    print(f"      Accuracy:  {acc * 100:.2f}%")
    print(f"      Precision: {prec * 100:.2f}%")
    print(f"      Recall:    {rec * 100:.2f}%")
    print(f"      F1-Score:  {f1 * 100:.2f}%")

    # Benchmarking inference latency (1,000 iterations)
    print("\n      Benchmarking inference latency (1,000 passes)...")
    sample_vec = X_test[0:1]
    latencies = []
    for _ in range(1000):
        t0 = time.perf_counter()
        mlp.predict(sample_vec)
        latencies.append((time.perf_counter() - t0) * 1000.0)

    avg_latency = float(np.mean(latencies))
    p95_latency = float(np.percentile(latencies, 95))
    print(f"      Mean Latency: {avg_latency:.3f} ms | P95: {p95_latency:.3f} ms")

    # Per-lighting condition results
    lighting_results = {}
    for cond in ["bright", "normal", "dim"]:
        mask = (light_test == cond)
        if np.sum(mask) > 0:
            cond_acc = float(accuracy_score(y_test[mask], y_pred[mask]))
            lighting_results[cond] = {
                "samples": int(np.sum(mask)),
                "accuracy": round(cond_acc * 100, 2)
            }
            print(f"      Lighting '{cond}': {cond_acc * 100:.2f}% ({np.sum(mask)} test samples)")

    # 5. Save Artifacts & Reports
    print("\n[5/5] Exporting model weights and evaluation reports...")

    # Save pickle model
    pickle_path = os.path.join(models_dir, "gesture_mlp_model.pkl")
    with open(pickle_path, "wb") as f:
        pickle.dump(mlp, f)

    # Classification report breakdown
    clf_report = classification_report(y_test, y_pred, target_names=GESTURE_CLASSES, output_dict=True)

    summary = {
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "total_samples": len(df),
        "test_samples": len(X_test),
        "accuracy": round(acc * 100, 2),
        "weighted_precision": round(prec * 100, 2),
        "weighted_recall": round(rec * 100, 2),
        "weighted_f1": round(f1 * 100, 2),
        "mean_latency_ms": round(avg_latency, 3),
        "p95_latency_ms": round(p95_latency, 3),
        "lighting_performance": lighting_results,
        "classes": GESTURE_CLASSES,
        "confusion_matrix": cm.tolist(),
        "per_class_metrics": {
            cls: {
                "precision": round(clf_report[cls]["precision"] * 100, 2),
                "recall": round(clf_report[cls]["recall"] * 100, 2),
                "f1": round(clf_report[cls]["f1-score"] * 100, 2),
                "support": clf_report[cls]["support"],
            }
            for cls in GESTURE_CLASSES
        }
    }

    # Save JSON summary
    summary_path = os.path.join(reports_dir, "evaluation_summary.json")
    with open(summary_path, "w") as f:
        json.dump(summary, f, indent=2)

    # Generate Markdown Report
    md_report_path = os.path.join(reports_dir, "evaluation_report.md")
    with open(md_report_path, "w") as f:
        f.write(f"# GestureDeck — ML Model Evaluation Report\n\n")
        f.write(f"- **Generated**: {summary['timestamp']}\n")
        f.write(f"- **Overall Test Accuracy**: **{summary['accuracy']}%**\n")
        f.write(f"- **Weighted F1-Score**: **{summary['weighted_f1']}%**\n")
        f.write(f"- **Average Inference Latency**: **{summary['mean_latency_ms']} ms** (Target: <50 ms)\n\n")

        f.write("## 1. Per-Class Precision, Recall & F1-Score\n\n")
        f.write("| Gesture Class | Precision (%) | Recall (%) | F1-Score (%) | Support |\n")
        f.write("|---|---|---|---|---|\n")
        for cls in GESTURE_CLASSES:
            m = summary["per_class_metrics"][cls]
            f.write(f"| **{cls}** | {m['precision']}% | {m['recall']}% | {m['f1']}% | {m['support']} |\n")

        f.write("\n## 2. Robustness Across Lighting Conditions\n\n")
        f.write("| Ambient Lighting | Test Samples | Accuracy (%) |\n")
        f.write("|---|---|---|\n")
        for cond, res in lighting_results.items():
            f.write(f"| **{cond.capitalize()}** | {res['samples']} | **{res['accuracy']}%** |\n")

        f.write("\n## 3. Confusion Matrix (8x8)\n\n")
        f.write("```\n")
        f.write(f"{'':15}" + "".join([f"{c[:6]:>8}" for c in GESTURE_CLASSES]) + "\n")
        for i, row in enumerate(cm):
            f.write(f"{GESTURE_CLASSES[i]:15}" + "".join([f"{val:>8}" for val in row]) + "\n")
        f.write("```\n")

    # Export weights for frontend TF.js consumption
    weights_json = {
        "modelTopology": {
            "input_dim": 63,
            "hidden_layers": [128, 64],
            "output_dim": 8,
            "classes": GESTURE_CLASSES
        },
        "weights": [
            w.tolist() for w in mlp.coefs_
        ],
        "biases": [
            b.tolist() for b in mlp.intercepts_
        ]
    }

    tfjs_model_path = os.path.join(tfjs_export_dir, "model_weights.json")
    with open(tfjs_model_path, "w") as f:
        json.dump(weights_json, f)

    print(f"\nArtifacts generated:")
    print(f"  - Model Pickle:   {pickle_path}")
    print(f"  - Summary JSON:   {summary_path}")
    print(f"  - Markdown Rep.:  {md_report_path}")
    print(f"  - TFJS Weights:   {tfjs_model_path}")
    print("\nTraining and evaluation pipeline finished with 100% success!")


if __name__ == "__main__":
    train_and_evaluate()
