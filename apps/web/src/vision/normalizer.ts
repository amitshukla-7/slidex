import { HandLandmarks, Point3D } from './types';

export class LandmarkNormalizer {
  /**
   * Translates landmarks relative to wrist (index 0) and scales by wrist-to-middle-MCP distance.
   * Returns a 63-element Float32Array suitable for neural network input.
   */
  static normalize(landmarks: HandLandmarks): Float32Array {
    if (!landmarks || landmarks.length !== 21) {
      return new Float32Array(63);
    }

    const wrist = landmarks[0];
    const middleMcp = landmarks[9];

    // Compute hand scale reference distance (wrist to middle MCP)
    const dx = middleMcp.x - wrist.x;
    const dy = middleMcp.y - wrist.y;
    const dz = middleMcp.z - wrist.z;
    const scale = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1.0;

    const output = new Float32Array(63);

    for (let i = 0; i < 21; i++) {
      const pt = landmarks[i];
      const offset = i * 3;
      output[offset] = (pt.x - wrist.x) / scale;
      output[offset + 1] = (pt.y - wrist.y) / scale;
      output[offset + 2] = (pt.z - wrist.z) / scale;
    }

    return output;
  }

  /**
   * Euclidean distance between two 3D points
   */
  static distance(p1: Point3D, p2: Point3D): number {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    const dz = p1.z - p2.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * 2D Euclidean distance (screen plane)
   */
  static distance2D(p1: Point3D, p2: Point3D): number {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
}
