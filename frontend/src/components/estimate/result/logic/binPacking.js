// src/components/estimate/result/logic/binPacking.js
import { Bin, Item, Packer } from "bin-packing-3d";
import { pickBestRotation, toNumber, itemCbm, maxDimOfItem, shuffleDeterministic } from "./packingUtils";
import { makeNonOverlapping, scorePackResult, isScoreBetter } from "./nonOverlap";
import { simplePack } from "./simplePack";

function extractPackedPosition(packedItem) {
  const p = packedItem?.position ?? packedItem?.pos ?? packedItem?.pivot ?? packedItem?.point ?? packedItem?.start ?? null;
  if (Array.isArray(p) && p.length >= 3) return { x: Number(p[0]), y: Number(p[1]), z: Number(p[2]) };
  if (p && typeof p === "object" && "x" in p && "y" in p && "z" in p) return { x: Number(p.x), y: Number(p.y), z: Number(p.z) };
  if (Number.isFinite(Number(packedItem?.x)) && Number.isFinite(Number(packedItem?.y)) && Number.isFinite(Number(packedItem?.z))) {
    return { x: Number(packedItem.x), y: Number(packedItem.y), z: Number(packedItem.z) };
  }
  return null;
}

function extractPackedDims(packedItem) {
  const w = toNumber(packedItem?.width ?? packedItem?.w, NaN);
  const h = toNumber(packedItem?.height ?? packedItem?.h, NaN);
  const d = toNumber(packedItem?.depth ?? packedItem?.d, NaN);
  if (Number.isFinite(w) && Number.isFinite(h) && Number.isFinite(d)) return { w, h, d };
  return null;
}

function packWithBinPacking3D(items, truck) {
  try {
    const packer = new Packer();
    const bin = new Bin(`truck-${truck.id ?? "x"}`, truck.w, truck.h, truck.d, 1e12);
    packer.add_bin(bin);

    const sourceByName = new Map();

    for (let idx = 0; idx < items.length; idx++) {
      const it = items[idx];
      const best = pickBestRotation(it, truck);

      const w = toNumber(best.x, 0);
      const h = toNumber(best.y, 0);
      const d = toNumber(best.z, 0);

      if (!w || !h || !d) continue;
      if (w > truck.w || d > truck.d || h > truck.h) continue;

      const stableId = it.item_id ?? `${it.furniture_id ?? "x"}-${idx}`;
      const name = `${stableId}`;
      const weight = toNumber(it.weight_kg ?? it.weight ?? 1, 1);

      packer.add_item(new Item(name, w, h, d, weight));
      sourceByName.set(name, {
        id: stableId,
        displayName: it.name_kr ?? "짐",
        w, h, d,
        rot: best.rot,
        _raw: it,
        _isBoxBundle: !!it._isBoxBundle,
        _bundleCount: it._bundleCount ?? 1,
      });
    }

    packer.pack(true, false);

    const packed = [];
    const unfittedNames = [];

    const bins = packer.bins ?? [];
    for (const b of bins) {
      const fitted = b.items ?? [];
      const notFit = b.unfitted_items ?? [];

      for (const pi of fitted) {
        const name = pi?.name;
        const src = sourceByName.get(name);
        if (!src) continue;

        const p = extractPackedPosition(pi);
        const dims = extractPackedDims(pi) ?? { w: src.w, h: src.h, d: src.d };
        if (!p) {
          unfittedNames.push(name);
          continue;
        }

        const pos = { x: p.x + dims.w / 2, y: p.y + dims.h / 2, z: p.z + dims.d / 2 };

        packed.push({
          id: src.id,
          name: src.displayName,
          w: dims.w, h: dims.h, d: dims.d,
          rot: src.rot,
          pos,
          _overflow: false,
          _raw: src._raw,
          _isBoxBundle: src._isBoxBundle,
          _bundleCount: src._bundleCount,
        });
      }

      for (const ui of notFit) {
        if (ui?.name) unfittedNames.push(ui.name);
      }
    }

    const unfittedItems = unfittedNames.map((nm) => sourceByName.get(nm)?._raw).filter(Boolean);
    return { packedPlacements: packed, unfittedItems };
  } catch (e) {
    console.warn("[bin-packing] fallback", e);
    const placements = simplePack(items, truck).map((p) => ({ ...p, _overflow: false }));
    return { packedPlacements: placements, unfittedItems: [] };
  }
}

export function packWithBinPacking3D_MultiTry(items, truck, tries = 9) {
  const base = items ?? [];

  const variants = [
    base,
    [...base].slice().sort((a, b) => (a._vol ?? itemCbm(a)) - (b._vol ?? itemCbm(b))),
    [...base].slice().sort((a, b) => (b._vol ?? itemCbm(b)) - (a._vol ?? itemCbm(a))),
    [...base].slice().sort((a, b) => maxDimOfItem(b) - maxDimOfItem(a)),
    [...base].slice().sort((a, b) => maxDimOfItem(a) - maxDimOfItem(b)),
    shuffleDeterministic(base, `S1-${truck.id}`),
    shuffleDeterministic(base, `S2-${truck.id}`),
    shuffleDeterministic(base, `S3-${truck.id}`),
    shuffleDeterministic(base, `S4-${truck.id}`),
    shuffleDeterministic(base, `S5-${truck.id}`),
  ].slice(0, Math.max(1, tries));

  let bestRes = null;
  let bestScore = null;

  for (let i = 0; i < variants.length; i++) {
    const res0 = packWithBinPacking3D(variants[i], truck);

    const { placed, rejected } = makeNonOverlapping(res0.packedPlacements, truck, {
      maxRadiusCm: 20,
      stepCm: 3,
      ySteps: [0, 3, -3, 6, -6],
    });

    const res = {
      packedPlacements: placed,
      overlapRejected: rejected,
      unfittedItems: [...(res0.unfittedItems ?? []), ...rejected.map((p) => p._raw).filter(Boolean)],
    };

    const sc = scorePackResult(res);
    if (!bestRes || isScoreBetter(sc, bestScore)) {
      bestRes = res;
      bestScore = sc;
      if (bestScore.overlapRejectedCnt === 0 && bestScore.unfittedCnt === 0) break;
    }
  }

  return bestRes ?? { packedPlacements: [], overlapRejected: [], unfittedItems: base };
}
