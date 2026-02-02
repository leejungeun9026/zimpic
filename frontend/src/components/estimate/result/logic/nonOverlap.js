// src/components/estimate/result/logic/nonOverlap.js
export const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

export function clampToTruckCenterPos(pos, w, h, d, truck) {
  const halfW = w / 2;
  const halfH = h / 2;
  const halfD = d / 2;
  return {
    x: clamp(pos.x, halfW, truck.w - halfW),
    y: clamp(pos.y, halfH, truck.h - halfH),
    z: clamp(pos.z, halfD, truck.d - halfD),
  };
}

export function aabbOf(p) {
  return {
    minX: p.pos.x - p.w / 2,
    maxX: p.pos.x + p.w / 2,
    minY: p.pos.y - p.h / 2,
    maxY: p.pos.y + p.h / 2,
    minZ: p.pos.z - p.d / 2,
    maxZ: p.pos.z + p.d / 2,
  };
}

export function aabbIntersects(a, b, eps = 0.001) {
  return !(
    a.maxX <= b.minX + eps ||
    a.minX >= b.maxX - eps ||
    a.maxY <= b.minY + eps ||
    a.minY >= b.maxY - eps ||
    a.maxZ <= b.minZ + eps ||
    a.minZ >= b.maxZ - eps
  );
}

export function intersectsAny(candidate, placed) {
  const A = aabbOf(candidate);
  for (const q of placed) {
    if (aabbIntersects(A, aabbOf(q))) return true;
  }
  return false;
}

export function tryResolveNonOverlap(basePlacement, truck, placed, opts = {}) {
  const maxRadiusCm = opts.maxRadiusCm ?? 18;
  const stepCm = opts.stepCm ?? 3;
  const ySteps = opts.ySteps ?? [0, 3, -3, 6, -6];

  const clampedPos = clampToTruckCenterPos(basePlacement.pos, basePlacement.w, basePlacement.h, basePlacement.d, truck);
  const first = { ...basePlacement, pos: clampedPos };

  if (!intersectsAny(first, placed)) return { ok: true, placement: first };

  const offsets = [];
  for (let r = stepCm; r <= maxRadiusCm; r += stepCm) {
    offsets.push([ r, 0],[-r, 0],[0, r],[0,-r],[ r, r],[ r,-r],[-r, r],[-r,-r]);
  }

  for (const dy of ySteps) {
    for (const [dx, dz] of offsets) {
      const pos = clampToTruckCenterPos(
        { x: clampedPos.x + dx, y: clampedPos.y + dy, z: clampedPos.z + dz },
        basePlacement.w, basePlacement.h, basePlacement.d, truck
      );
      const cand = { ...basePlacement, pos };
      if (!intersectsAny(cand, placed)) return { ok: true, placement: cand };
    }
  }

  return { ok: false, placement: first };
}

export function makeNonOverlapping(packedPlacements, truck, resolveOpts) {
  const placed = [];
  const rejected = [];

  const sorted = [...(packedPlacements ?? [])]
    .sort((a, b) => (b.w * b.d * b.h) - (a.w * a.d * a.h));

  for (const p0 of sorted) {
    const base = { ...p0, pos: clampToTruckCenterPos(p0.pos, p0.w, p0.h, p0.d, truck) };
    const res = tryResolveNonOverlap(base, truck, placed, resolveOpts);
    if (res.ok) placed.push(res.placement);
    else rejected.push(p0);
  }

  return { placed, rejected };
}

export function scorePackResult(res) {
  const unfittedCnt = (res?.unfittedItems?.length ?? 0);
  const overlapRejectedCnt = (res?.overlapRejected?.length ?? 0);

  const packedVol = (res?.packedPlacements ?? []).reduce((sum, p) => {
    const w = Number.isFinite(p.w) ? p.w : 0;
    const d = Number.isFinite(p.d) ? p.d : 0;
    const h = Number.isFinite(p.h) ? p.h : 0;
    return sum + (w * d * h) / 1_000_000;
  }, 0);

  const packedCnt = (res?.packedPlacements?.length ?? 0);
  return { overlapRejectedCnt, unfittedCnt, packedVol, packedCnt };
}

export function isScoreBetter(a, b) {
  if (a.overlapRejectedCnt !== b.overlapRejectedCnt) return a.overlapRejectedCnt < b.overlapRejectedCnt;
  if (a.unfittedCnt !== b.unfittedCnt) return a.unfittedCnt < b.unfittedCnt;
  if (a.packedVol !== b.packedVol) return a.packedVol > b.packedVol;
  return a.packedCnt > b.packedCnt;
}
