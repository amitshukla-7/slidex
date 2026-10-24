"""
GestureDeck - Webcam Landmark Collection Script
Records live 21-point 3D hand coordinates from webcam to normalized CSV dataset.
Usage: python collect_data.py --gesture OPEN_PALM --samples 500
"""

import argparse
import time
import os
import csv
import cv2
import mediapipe as mp
import numpy as np

from dataset_schema import FEATURE_COLUMNS, METADATA_COLUMNS, normalize_landmarks, GESTURE_CLASSES


def collect_landmarks(gesture_name: str, target_samples: int = 500, output_path: str = "ml/data/gestures_dataset.csv"):
    if gesture_name not in GESTURE_CLASSES:
        print(f"Error: Gesture '{gesture_name}' not in recognized classes: {GESTURE_CLASSES}")
        return

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    file_exists = os.path.isfile(output_path)

    mp_hands = mp.solutions.hands
    mp_draw = mp.solutions.drawing_utils
    hands = mp_hands.Hands(
        static_image_mode=False,
        max_num_hands=1,
        min_detection_confidence=0.7,
        min_tracking_confidence=0.7
    )

    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("Error: Could not open webcam.")
        return

    print(f"\n==========================================")
    print(f" Collecting {target_samples} samples for: {gesture_name}")
    print(f" Press 'SPACE' to start/pause recording")
    print(f" Press 'Q' or 'ESC' to exit")
    print(f"==========================================\n")

    recorded = 0
    recording = False

    with open(output_path, mode="a", newline="") as f:
        writer = csv.writer(f)
        if not file_exists:
            writer.writerow(FEATURE_COLUMNS + METADATA_COLUMNS)

        while cap.isOpened() and recorded < target_samples:
            success, frame = cap.read()
            if not success:
                continue

            frame = cv2.flip(frame, 1)
            h, w, _ = frame.shape
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = hands.process(rgb_frame)

            status_text = f"Recording: {recorded}/{target_samples}" if recording else "PAUSED (Press Space)"
            status_color = (0, 255, 0) if recording else (0, 165, 255)

            if results.multi_hand_landmarks:
                for hand_lms, handedness in zip(results.multi_hand_landmarks, results.multi_handedness):
                    mp_draw.draw_landmarks(frame, hand_lms, mp_hands.HAND_CONNECTIONS)
                    hand_label = handedness.classification[0].label

                    if recording:
                        raw_coords = []
                        for lm in hand_lms.landmark:
                            raw_coords.extend([lm.x, lm.y, lm.z])

                        norm_coords = normalize_landmarks(np.array(raw_coords))
                        row = list(norm_coords) + [gesture_name, hand_label, "normal", time.time()]
                        writer.writerow(row)
                        recorded += 1

            cv2.putText(frame, f"Gesture: {gesture_name}", (20, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
            cv2.putText(frame, status_text, (20, 80), cv2.FONT_HERSHEY_SIMPLEX, 0.7, status_color, 2)
            cv2.imshow("GestureDeck - Landmark Recorder", frame)

            key = cv2.waitKey(1) & 0xFF
            if key == 32:  # Spacebar
                recording = not recording
            elif key == ord('q') or key == 27:
                break

    cap.release()
    cv2.destroyAllWindows()
    print(f"Finished. Saved {recorded} samples for {gesture_name} to {output_path}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Collect hand gesture landmarks")
    parser.add_argument("--gesture", type=str, default="OPEN_PALM", help="Target gesture label")
    parser.add_argument("--samples", type=int, default=500, help="Number of samples to collect")
    parser.add_argument("--out", type=str, default="ml/data/gestures_dataset.csv", help="Output CSV path")
    args = parser.parse_args()

    collect_landmarks(args.gesture, args.samples, args.out)
