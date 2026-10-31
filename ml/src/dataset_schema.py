"""
slideX ML Pipeline - Dataset Schema & Feature Normalization
Defines the 63 normalized landmark features, class labels, and geometric scaling.
"""

from typing import List, Dict
import numpy as np

GESTURE_CLASSES: List[str] = [
    "OPEN_PALM",
    "SWIPE_LEFT",
    "SWIPE_RIGHT",
    "POINTING",
    "PINCH",
    "FIST",
    "THUMBS_UP",
    "TWO_FINGERS",
]

CLASS_TO_INDEX: Dict[str, int] = {name: idx for idx, name in enumerate(GESTURE_CLASSES)}
INDEX_TO_CLASS: Dict[int, str] = {idx: name for idx, name in enumerate(GESTURE_CLASSES)}

# 21 MediaPipe hand landmarks in standard anatomical order
LANDMARK_NAMES = [
    "wrist",
    "thumb_cmc", "thumb_mcp", "thumb_ip", "thumb_tip",
    "index_mcp", "index_pip", "index_dip", "index_tip",
    "middle_mcp", "middle_pip", "middle_dip", "middle_tip",
    "ring_mcp", "ring_pip", "ring_dip", "ring_tip",
    "pinky_mcp", "pinky_pip", "pinky_dip", "pinky_tip"
]

FEATURE_COLUMNS: List[str] = []
for lm in LANDMARK_NAMES:
    FEATURE_COLUMNS.extend([f"{lm}_x", f"{lm}_y", f"{lm}_z"])

METADATA_COLUMNS = ["gesture_label", "handedness", "lighting_condition", "timestamp"]


def normalize_landmarks(raw_landmarks_63: np.ndarray) -> np.ndarray:
    """
    Translates coordinates relative to wrist (landmark 0) and scales
    by Euclidean distance from wrist to middle MCP (landmark 9).
    Matches LandmarkNormalizer.normalize in TypeScript.
    """
    pts = raw_landmarks_63.reshape((21, 3))
    wrist = pts[0]
    middle_mcp = pts[9]

    # Hand reference distance
    scale = np.linalg.norm(middle_mcp - wrist)
    if scale < 1e-4:
        scale = 1.0

    normalized = (pts - wrist) / scale
    return normalized.flatten()
