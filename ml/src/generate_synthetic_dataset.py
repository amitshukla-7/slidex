"""
slideX - Synthetic Landmark Dataset Generator
Generates realistic 3D hand landmark distributions across all 8 gesture categories
with authentic biomechanical constraints and lighting-condition noise.
"""

import os
import csv
import numpy as np
from dataset_schema import FEATURE_COLUMNS, METADATA_COLUMNS, GESTURE_CLASSES, normalize_landmarks


def generate_posture_base(gesture: str) -> np.ndarray:
    """
    Returns 21 base 3D coordinates matching anatomical hand kinematics for the gesture.
    """
    pts = np.zeros((21, 3))
    # Wrist origin
    pts[0] = [0.5, 0.8, 0.0]

    # Thumb base
    pts[1] = [0.42, 0.74, -0.01]
    pts[2] = [0.36, 0.68, -0.02]
    pts[3] = [0.32, 0.62, -0.03]

    # Knuckles (MCPs)
    pts[5] = [0.44, 0.55, 0.0]   # Index MCP
    pts[9] = [0.50, 0.52, 0.0]   # Middle MCP
    pts[13] = [0.56, 0.55, 0.0]  # Ring MCP
    pts[17] = [0.62, 0.60, 0.0]  # Pinky MCP

    def extend_finger(mcp_idx: int, dir_vec: np.ndarray, lengths=(0.08, 0.06, 0.05)):
        base = pts[mcp_idx]
        pts[mcp_idx + 1] = base + dir_vec * lengths[0]
        pts[mcp_idx + 2] = pts[mcp_idx + 1] + dir_vec * lengths[1]
        pts[mcp_idx + 3] = pts[mcp_idx + 2] + dir_vec * lengths[2]

    def curl_finger(mcp_idx: int):
        base = pts[mcp_idx]
        curl_vec = np.array([0.0, 0.05, 0.04])
        pts[mcp_idx + 1] = base + curl_vec * 0.6
        pts[mcp_idx + 2] = base + curl_vec * 0.9 + np.array([0, 0.02, 0])
        pts[mcp_idx + 3] = base + curl_vec * 0.7 + np.array([0, 0.04, -0.02])

    up = np.array([0.0, -1.0, 0.0])

    if gesture == "OPEN_PALM":
        pts[4] = pts[3] + np.array([-0.06, -0.06, -0.02])
        extend_finger(5, up + np.array([-0.05, 0, 0]))
        extend_finger(9, up)
        extend_finger(13, up + np.array([0.04, 0, 0]))
        extend_finger(17, up + np.array([0.08, 0, 0]))

    elif gesture == "POINTING":
        # Index extended, other fingers curled
        pts[4] = pts[3] + np.array([0.02, 0.02, 0.02])
        extend_finger(5, up)
        curl_finger(9)
        curl_finger(13)
        curl_finger(17)

    elif gesture == "PINCH":
        # Thumb tip and Index tip touching
        pinch_target = np.array([0.40, 0.48, 0.0])
        pts[4] = pinch_target
        pts[8] = pinch_target + np.array([0.01, 0.01, 0.0])
        pts[6] = pts[5] + up * 0.06
        pts[7] = (pts[6] + pts[8]) / 2
        curl_finger(9)
        curl_finger(13)
        curl_finger(17)

    elif gesture == "FIST":
        pts[4] = pts[3] + np.array([0.03, 0.03, 0.02])
        curl_finger(5)
        curl_finger(9)
        curl_finger(13)
        curl_finger(17)

    elif gesture == "THUMBS_UP":
        # Thumb pointing strongly upward, other 4 curled
        pts[4] = pts[3] + np.array([0.0, -0.10, 0.0])
        curl_finger(5)
        curl_finger(9)
        curl_finger(13)
        curl_finger(17)

    elif gesture == "TWO_FINGERS":
        # Index and middle extended in V-shape
        pts[4] = pts[3] + np.array([0.02, 0.02, 0.02])
        extend_finger(5, up + np.array([-0.08, 0, 0]))
        extend_finger(9, up + np.array([0.08, 0, 0]))
        curl_finger(13)
        curl_finger(17)

    elif gesture == "SWIPE_LEFT":
        pts[4] = pts[3] + np.array([-0.04, -0.04, 0])
        extend_finger(5, up + np.array([-0.15, 0, 0]))
        extend_finger(9, up + np.array([-0.12, 0, 0]))
        extend_finger(13, up + np.array([-0.10, 0, 0]))
        extend_finger(17, up + np.array([-0.08, 0, 0]))

    elif gesture == "SWIPE_RIGHT":
        pts[4] = pts[3] + np.array([0.04, -0.04, 0])
        extend_finger(5, up + np.array([0.15, 0, 0]))
        extend_finger(9, up + np.array([0.12, 0, 0]))
        extend_finger(13, up + np.array([0.10, 0, 0]))
        extend_finger(17, up + np.array([0.08, 0, 0]))

    return pts


def generate_dataset(samples_per_class: int = 700, output_path: str = "ml/data/gestures_dataset.csv"):
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    rows = []

    lighting_conditions = ["bright", "normal", "dim"]

    print(f"Generating synthetic dataset: {samples_per_class * len(GESTURE_CLASSES)} total samples...")

    for gesture in GESTURE_CLASSES:
        base_pts = generate_posture_base(gesture)

        for i in range(samples_per_class):
            lighting = lighting_conditions[i % len(lighting_conditions)]
            noise_sigma = 0.008 if lighting == "bright" else (0.012 if lighting == "normal" else 0.020)

            # Random scale variation (±12%)
            scale = np.random.uniform(0.88, 1.12)
            pts = base_pts * scale

            # Random 2D planar rotation (±15 degrees)
            angle = np.random.uniform(-np.radians(15), np.radians(15))
            cos_a, sin_a = np.cos(angle), np.sin(angle)
            rotated_x = pts[:, 0] * cos_a - pts[:, 1] * sin_a
            rotated_y = pts[:, 0] * sin_a + pts[:, 1] * cos_a
            pts[:, 0] = rotated_x
            pts[:, 1] = rotated_y

            # Random 3D translation
            trans = np.random.uniform(-0.15, 0.15, size=(1, 3))
            pts += trans

            # Sensor Gaussian noise based on lighting
            noise = np.random.normal(0, noise_sigma, pts.shape)
            pts += noise

            # Apply wrist-relative and hand-span normalization
            norm_features = normalize_landmarks(pts.flatten())

            handedness = "Right" if np.random.rand() > 0.3 else "Left"
            row = list(norm_features) + [gesture, handedness, lighting, 1729750000.0 + i]
            rows.append(row)

    with open(output_path, mode="w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(FEATURE_COLUMNS + METADATA_COLUMNS)
        writer.writerows(rows)

    print(f"Dataset generated successfully with {len(rows)} samples at {output_path}")


if __name__ == "__main__":
    generate_dataset()
