export type GestureName = 'OPEN PALM' | 'CLOSED FIST' | 'V SIGN' | 'OK SIGN';

export interface NormalizedLandmark {
  x: number;
  y: number;
  z: number;
}

export interface LandmarkConnection {
  start: number;
  end: number;
}

export interface GestureDiagnostics {
  handDetected: boolean;
  landmarksCount: number;
  normThumbIndexDist: number;
  thumbIndexDist2d: number;
  thumbIndexDist3d: number;
  palmScale: number;
  middleExt: boolean;
  ringExt: boolean;
  pinkyExt: boolean;
  extRemainingCount: number;
  isPinchContact: boolean;
  isIndexCurled: boolean;
  isMiddleSeparated: boolean;
  hasRemainingExtended: boolean;
  predictedGesture: GestureName | 'NONE';
  rejectionReason?: string;
}

export interface GestureClassificationResult {
  gesture: GestureName;
  confidence: number;
  diagnostics?: GestureDiagnostics;
}

// MediaPipe 21 hand landmark connections
export const HAND_CONNECTIONS: LandmarkConnection[] = [
  // Thumb
  { start: 0, end: 1 },
  { start: 1, end: 2 },
  { start: 2, end: 3 },
  { start: 3, end: 4 },
  // Index
  { start: 0, end: 5 },
  { start: 5, end: 6 },
  { start: 6, end: 7 },
  { start: 7, end: 8 },
  // Middle
  { start: 0, end: 9 },
  { start: 9, end: 10 },
  { start: 10, end: 11 },
  { start: 11, end: 12 },
  // Ring
  { start: 0, end: 13 },
  { start: 13, end: 14 },
  { start: 14, end: 15 },
  { start: 15, end: 16 },
  // Pinky
  { start: 0, end: 17 },
  { start: 17, end: 18 },
  { start: 18, end: 19 },
  { start: 19, end: 20 },
  // Palm base cross
  { start: 5, end: 9 },
  { start: 9, end: 13 },
  { start: 13, end: 17 },
];

/**
 * Calculates Euclidean distance between two 3D landmarks
 */
export function euclideanDistance(a: NormalizedLandmark, b: NormalizedLandmark): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = (a.z ?? 0) - (b.z ?? 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Calculates 2D Euclidean distance (ignores z-depth noise)
 */
export function euclideanDistance2D(a: NormalizedLandmark, b: NormalizedLandmark): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Robust geometric hand gesture classification based on 21 MediaPipe hand landmarks.
 * Landmarks index mapping:
 * 0: WRIST
 * 1-4: THUMB (4 is TIP, 3 is IP, 2 is MCP)
 * 5-8: INDEX (8 is TIP, 7 is DIP, 6 is PIP, 5 is MCP)
 * 9-12: MIDDLE (12 is TIP, 11 is DIP, 10 is PIP, 9 is MCP)
 * 13-16: RING (16 is TIP, 15 is DIP, 14 is PIP, 13 is MCP)
 * 17-20: PINKY (20 is TIP, 19 is DIP, 18 is PIP, 17 is MCP)
 */
export function classifyHandGesture(
  landmarks: NormalizedLandmark[],
  recognizedCategoryName?: string,
  modelScore?: number
): GestureClassificationResult | null {
  if (!landmarks || landmarks.length < 21) return null;

  const wrist = landmarks[0];
  const thumbTip = landmarks[4];
  const thumbIp = landmarks[3];
  const thumbMcp = landmarks[2];

  const indexTip = landmarks[8];
  const indexDip = landmarks[7];
  const indexPip = landmarks[6];
  const indexMcp = landmarks[5];

  const middleTip = landmarks[12];
  const middlePip = landmarks[10];
  const middleMcp = landmarks[9];

  const ringTip = landmarks[16];
  const ringPip = landmarks[14];
  const ringMcp = landmarks[13];

  const pinkyTip = landmarks[20];
  const pinkyPip = landmarks[18];
  const pinkyMcp = landmarks[17];

  // Palm scale reference: combined palm length and width (scale-invariant)
  const palmLength = euclideanDistance(wrist, middleMcp);
  const palmWidth = euclideanDistance(indexMcp, pinkyMcp);
  const palmScale = Math.max(0.04, palmLength * 0.7 + palmWidth * 0.3);

  // Determine if fingers are extended or folded
  // A finger is extended when tip-to-MCP distance is high, or tip-to-wrist notably exceeds pip-to-wrist
  const isExtended = (tip: NormalizedLandmark, pip: NormalizedLandmark, mcp: NormalizedLandmark) => {
    const tipMcp = euclideanDistance(tip, mcp);
    const tipDist = euclideanDistance(wrist, tip);
    const pipDist = euclideanDistance(wrist, pip);
    const mcpDist = euclideanDistance(wrist, mcp);
    return tipMcp > palmScale * 0.68 || (tipDist > pipDist * 1.04 && tipDist > mcpDist * 1.10);
  };

  const isFolded = (tip: NormalizedLandmark, pip: NormalizedLandmark, mcp: NormalizedLandmark) => {
    const tipDist = euclideanDistance(wrist, tip);
    const pipDist = euclideanDistance(wrist, pip);
    const tipToMcp = euclideanDistance(tip, mcp);
    return (tipDist <= pipDist * 1.05 && tipToMcp < palmScale * 0.65) || tipToMcp < palmScale * 0.50;
  };

  const indexExt = isExtended(indexTip, indexPip, indexMcp);
  const middleExt = isExtended(middleTip, middlePip, middleMcp);
  const ringExt = isExtended(ringTip, ringPip, ringMcp);
  const pinkyExt = isExtended(pinkyTip, pinkyPip, pinkyMcp);

  const indexFolded = isFolded(indexTip, indexPip, indexMcp);
  const middleFolded = isFolded(middleTip, middlePip, middleMcp);
  const ringFolded = isFolded(ringTip, ringPip, ringMcp);
  const pinkyFolded = isFolded(pinkyTip, pinkyPip, pinkyMcp);

  // 1. EVALUATE OK SIGN GEOMETRY FIRST (Priority Check)
  // Distance between thumb tip/pad and index tip / DIP / PIP
  const thumbIndexTipDist2d = euclideanDistance2D(thumbTip, indexTip);
  const thumbIndexTipDist3d = euclideanDistance(thumbTip, indexTip);
  const thumbIndexDipDist2d = euclideanDistance2D(thumbTip, indexDip);
  const thumbIndexDipDist3d = euclideanDistance(thumbTip, indexDip);
  const thumbIpIndexTipDist2d = euclideanDistance2D(thumbIp, indexTip);

  // Users frequently touch thumb tip to index DIP/pad or thumb pad to index tip
  const effectiveThumbIndexDist = Math.min(
    thumbIndexTipDist2d,
    thumbIndexTipDist3d,
    thumbIndexDipDist2d,
    thumbIndexDipDist3d,
    thumbIpIndexTipDist2d
  );
  const normThumbIndexDist = effectiveThumbIndexDist / palmScale;

  // Thumb to other fingertips (middle, ring, pinky) to ensure it's not a fist or multi-finger pinch
  const thumbToMiddleDist = euclideanDistance(thumbTip, middleTip);
  const thumbToMiddleDist2d = euclideanDistance2D(thumbTip, middleTip);
  const effectiveThumbMiddleDist = Math.min(thumbToMiddleDist, thumbToMiddleDist2d);

  // In an OK sign, middle, ring, pinky fingers are upright/extended away from the palm loop
  // Check extension using both 3D/2D wrist distance and tip-to-MCP clearance
  const isOkExtended = (tip: NormalizedLandmark, pip: NormalizedLandmark, mcp: NormalizedLandmark) => {
    const tipMcp = euclideanDistance(tip, mcp);
    const tipDist = euclideanDistance(wrist, tip);
    const pipDist = euclideanDistance(wrist, pip);
    const mcpDist = euclideanDistance(wrist, mcp);
    const tipMcp2d = euclideanDistance2D(tip, mcp);
    return (
      tipMcp > palmScale * 0.58 ||
      tipMcp2d > palmScale * 0.55 ||
      (tipDist > pipDist * 1.01 && tipDist > mcpDist * 1.05)
    );
  };

  const middleExtOk = isOkExtended(middleTip, middlePip, middleMcp);
  const ringExtOk = isOkExtended(ringTip, ringPip, ringMcp);
  const pinkyExtOk = isOkExtended(pinkyTip, pinkyPip, pinkyMcp);

  const extRemainingCount =
    (middleExtOk ? 1 : 0) + (ringExtOk ? 1 : 0) + (pinkyExtOk ? 1 : 0);

  // OK Sign Verification Conditions:
  // a) Thumb and index tips/pads form a circular pinch or near-contact (normThumbIndexDist < 0.65)
  // Adjusted threshold empirically accounts for camera distance and landmark jitter
  const isPinchContact = normThumbIndexDist < 0.65;

  // b) Index finger is looped/curled (tip is closer to its MCP or PIP than in an open palm)
  const indexTipMcpDist = euclideanDistance(indexTip, indexMcp);
  const isIndexCurled =
    indexTipMcpDist < palmScale * 1.25 ||
    thumbIndexTipDist2d < palmScale * 0.60;

  // c) Middle finger is separated from thumb & index circle (distinguishes from closed fist or all-finger pinch)
  const isMiddleSeparated =
    effectiveThumbMiddleDist > effectiveThumbIndexDist * 1.15 &&
    effectiveThumbMiddleDist > palmScale * 0.32;

  // d) Remaining fingers: at least middle is extended and extCount >= 1, or at least 2 of (middle, ring, pinky) are extended
  const hasRemainingExtended =
    (middleExtOk && (!middleFolded || extRemainingCount >= 2)) ||
    extRemainingCount >= 2;

  // Diagnostic tracking for OK sign candidate
  let okRejectionReason: string | undefined = undefined;
  if (!isPinchContact) {
    okRejectionReason = `Thumb-index gap too wide (${normThumbIndexDist.toFixed(2)} >= 0.65)`;
  } else if (!isIndexCurled) {
    okRejectionReason = 'Index finger is straight, not forming circle';
  } else if (!isMiddleSeparated) {
    okRejectionReason = 'Middle finger touching thumb (pinch/fist)';
  } else if (!hasRemainingExtended) {
    okRejectionReason = `Insufficient remaining finger extension (extCount: ${extRemainingCount})`;
  }

  const diagnostics: GestureDiagnostics = {
    handDetected: true,
    landmarksCount: landmarks.length,
    normThumbIndexDist,
    thumbIndexDist2d: thumbIndexTipDist2d,
    thumbIndexDist3d: thumbIndexTipDist3d,
    palmScale,
    middleExt: middleExtOk,
    ringExt: ringExtOk,
    pinkyExt: pinkyExtOk,
    extRemainingCount,
    isPinchContact,
    isIndexCurled,
    isMiddleSeparated,
    hasRemainingExtended,
    predictedGesture: 'NONE',
    rejectionReason: okRejectionReason,
  };

  if (isPinchContact && isIndexCurled && isMiddleSeparated && hasRemainingExtended) {
    const confidence = Math.min(
      99,
      Math.round(92 + (1 - Math.min(1, normThumbIndexDist / 0.65)) * 7)
    );
    diagnostics.predictedGesture = 'OK SIGN';
    diagnostics.rejectionReason = undefined;
    return { gesture: 'OK SIGN', confidence, diagnostics };
  }

  // 2. Check V SIGN (Victory / Two fingers):
  // Index and Middle extended; Ring and Pinky folded; Tip separation reasonable
  const indexMiddleSeparation = euclideanDistance(indexTip, middleTip);
  if (indexExt && middleExt && ringFolded && pinkyFolded) {
    const confidence = Math.min(98, Math.round(90 + Math.min(8, indexMiddleSeparation * 20)));
    diagnostics.predictedGesture = 'V SIGN';
    return { gesture: 'V SIGN', confidence, diagnostics };
  }

  // Also catch V sign if ring is slightly extended but pinky folded
  if (indexExt && middleExt && !ringExt && pinkyFolded) {
    diagnostics.predictedGesture = 'V SIGN';
    return { gesture: 'V SIGN', confidence: 88, diagnostics };
  }

  // 3. Check CLOSED FIST:
  // All 4 main fingers folded into palm
  if (indexFolded && middleFolded && ringFolded && pinkyFolded) {
    const avgTipToWrist =
      (euclideanDistance(wrist, indexTip) +
        euclideanDistance(wrist, middleTip) +
        euclideanDistance(wrist, ringTip) +
        euclideanDistance(wrist, pinkyTip)) /
      4;
    const confidence = avgTipToWrist < palmScale * 1.3 ? 96 : 89;
    diagnostics.predictedGesture = 'CLOSED FIST';
    return { gesture: 'CLOSED FIST', confidence, diagnostics };
  }

  // 4. Check OPEN PALM:
  // All 4 main fingers clearly extended
  if (indexExt && middleExt && ringExt && pinkyExt) {
    const thumbDist = euclideanDistance(wrist, thumbTip);
    const confidence = thumbDist > palmScale * 0.9 ? 97 : 91;
    diagnostics.predictedGesture = 'OPEN PALM';
    return { gesture: 'OPEN PALM', confidence, diagnostics };
  }

  // If geometric rule had marginal conditions, check MediaPipe default category
  if (recognizedCategoryName) {
    const cat = recognizedCategoryName.toLowerCase();
    const conf = modelScore ? Math.round(modelScore * 100) : 85;
    if (cat.includes('open_palm') || cat.includes('palm')) {
      diagnostics.predictedGesture = 'OPEN PALM';
      return { gesture: 'OPEN PALM', confidence: conf, diagnostics };
    }
    if (cat.includes('closed_fist') || cat.includes('fist')) {
      diagnostics.predictedGesture = 'CLOSED FIST';
      return { gesture: 'CLOSED FIST', confidence: conf, diagnostics };
    }
    if (cat.includes('victory') || cat.includes('peace') || cat.includes('v_sign')) {
      diagnostics.predictedGesture = 'V SIGN';
      return { gesture: 'V SIGN', confidence: conf, diagnostics };
    }
    if (cat.includes('ok') || cat.includes('pinch')) {
      diagnostics.predictedGesture = 'OK SIGN';
      return { gesture: 'OK SIGN', confidence: conf, diagnostics };
    }
  }

  return null;
}
