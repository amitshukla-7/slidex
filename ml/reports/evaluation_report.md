# GestureDeck — ML Model Evaluation Report

- **Generated**: 2026-10-24 12:11:19
- **Overall Test Accuracy**: **98.12%**
- **Weighted F1-Score**: **98.11%**
- **Average Inference Latency**: **0.182 ms** (Target: <50 ms)

## 1. Per-Class Precision, Recall & F1-Score

| Gesture Class | Precision (%) | Recall (%) | F1-Score (%) | Support |
|---|---|---|---|---|
| **OPEN_PALM** | 95.59% | 92.86% | 94.2% | 140.0 |
| **SWIPE_LEFT** | 93.48% | 92.14% | 92.81% | 140.0 |
| **SWIPE_RIGHT** | 95.89% | 100.0% | 97.9% | 140.0 |
| **POINTING** | 100.0% | 100.0% | 100.0% | 140.0 |
| **PINCH** | 100.0% | 100.0% | 100.0% | 140.0 |
| **FIST** | 100.0% | 100.0% | 100.0% | 140.0 |
| **THUMBS_UP** | 100.0% | 100.0% | 100.0% | 140.0 |
| **TWO_FINGERS** | 100.0% | 100.0% | 100.0% | 140.0 |

## 2. Robustness Across Lighting Conditions

| Ambient Lighting | Test Samples | Accuracy (%) |
|---|---|---|
| **Bright** | 385 | **99.74%** |
| **Normal** | 380 | **99.47%** |
| **Dim** | 355 | **94.93%** |

## 3. Confusion Matrix (8x8)

```
                 OPEN_P  SWIPE_  SWIPE_  POINTI   PINCH    FIST  THUMBS  TWO_FI
OPEN_PALM           130       9       1       0       0       0       0       0
SWIPE_LEFT            6     129       5       0       0       0       0       0
SWIPE_RIGHT           0       0     140       0       0       0       0       0
POINTING              0       0       0     140       0       0       0       0
PINCH                 0       0       0       0     140       0       0       0
FIST                  0       0       0       0       0     140       0       0
THUMBS_UP             0       0       0       0       0       0     140       0
TWO_FINGERS           0       0       0       0       0       0       0     140
```
