// src/components/estimate/result/logic/packingUtils.js
export function toNumber(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function itemCbm(it) {
  const w = toNumber(it.packed_w_cm ?? it.w_cm ?? 0);
  const d = toNumber(it.packed_d_cm ?? it.d_cm ?? 0);
  const h = toNumber(it.packed_h_cm ?? it.h_cm ?? 0);
  return (w * d * h) / 1_000_000;
}

export function dimsByRotation(w, d, h, rot) {
  const map = { W: w, D: d, H: h };
  return { x: map[rot[0]], z: map[rot[1]], y: map[rot[2]] };
}

export function pickBestRotation(item, truck) {
  const w = Number(item.packed_w_cm ?? item.w_cm ?? 0);
  const d = Number(item.packed_d_cm ?? item.d_cm ?? 0);
  const h = Number(item.packed_h_cm ?? item.h_cm ?? 0);

  const rots =
    Array.isArray(item.allowed_rotations) && item.allowed_rotations.length
      ? item.allowed_rotations
      : ["WDH"];

  let best = null;
  let bestScore = Infinity;

  for (const rot of rots) {
    const dims = dimsByRotation(w, d, h, rot);
    if (dims.y > truck.h) continue;

    const score = dims.x * dims.z + dims.y * 10;
    if (score < bestScore) {
      bestScore = score;
      best = { rot, ...dims, footprint: dims.x * dims.z };
    }
  }

  if (!best) {
    const dims = dimsByRotation(w, d, h, rots[0]);
    return { rot: rots[0], ...dims, footprint: dims.x * dims.z };
  }
  return best;
}

export function hash01(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

export function maxDimOfItem(it) {
  const w = toNumber(it.packed_w_cm ?? it.w_cm ?? 0);
  const d = toNumber(it.packed_d_cm ?? it.d_cm ?? 0);
  const h = toNumber(it.packed_h_cm ?? it.h_cm ?? 0);
  return Math.max(w, d, h);
}

export function shuffleDeterministic(arr, seedStr) {
  return [...arr]
    .map((v, i) => ({
      v,
      r: hash01(`${seedStr}-${i}-${String(v.item_id ?? v.furniture_id ?? v.name_kr ?? "")}`),
    }))
    .sort((a, b) => a.r - b.r)
    .map((x) => x.v);
}

export function canFitInTruck(it, truck) {
  const best = pickBestRotation(it, truck);
  const w = toNumber(best.x, 0);
  const h = toNumber(best.y, 0);
  const d = toNumber(best.z, 0);
  if (!w || !h || !d) return false;
  return w <= truck.w && d <= truck.d && h <= truck.h;
}
