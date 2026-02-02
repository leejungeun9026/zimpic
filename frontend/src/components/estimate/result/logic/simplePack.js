// src/components/estimate/result/logic/simplePack.js
import { pickBestRotation, toNumber, itemCbm, canFitInTruck } from "./packingUtils";

export function simplePack(items, truck, opts = {}) {
  const placements = [];
  let cursorX = 0;
  let cursorZ = 0;
  let cursorY = 0;
  let rowMaxZ = 0;
  let layerMaxY = 0;

  const GAP = opts.gap ?? 5;
  const originX = opts.originX ?? 0;
  const originZ = opts.originZ ?? 0;
  const originY = opts.originY ?? 0;
  const respectBounds = opts.respectBounds ?? true;

  for (let idx = 0; idx < items.length; idx++) {
    const item = items[idx];
    const best = pickBestRotation(item, truck);
    const { x: w, y: h, z: d, rot } = best;
    if (!w || !h || !d) continue;

    const isStackable = item.stackable !== false;
    if (!isStackable && cursorY > 0) continue;

    if (respectBounds) {
      if (h > truck.h) continue;
      if (cursorX + w > truck.w) {
        cursorX = 0;
        cursorZ += rowMaxZ + GAP;
        rowMaxZ = 0;
      }
      if (cursorZ + d > truck.d) {
        cursorX = 0;
        cursorZ = 0;
        cursorY += layerMaxY + GAP;
        layerMaxY = 0;
        rowMaxZ = 0;
      }
      if (cursorY + h > truck.h) continue;
    } else {
      const LIMIT_X = 520;
      const LIMIT_Z = 520;
      if (cursorX + w > LIMIT_X) {
        cursorX = 0;
        cursorZ += rowMaxZ + GAP;
        rowMaxZ = 0;
      }
      if (cursorZ + d > LIMIT_Z) {
        cursorX = 0;
        cursorZ = 0;
        cursorY += layerMaxY + GAP;
        layerMaxY = 0;
        rowMaxZ = 0;
      }
    }

    const pos = {
      x: originX + cursorX + w / 2,
      y: originY + cursorY + h / 2,
      z: originZ + cursorZ + d / 2,
    };

    const stableId =
      item.item_id ??
      `${item.furniture_id ?? "x"}-${idx}-${Math.floor(pos.x)}-${Math.floor(pos.y)}-${Math.floor(pos.z)}`;

    placements.push({
      id: stableId,
      name: item.name_kr ?? "짐",
      w, h, d, rot, pos,
      _isBoxBundle: !!item._isBoxBundle,
      _bundleCount: item._bundleCount ?? 1,
      _overflow: !!opts.overflow,
      _raw: item,
    });

    cursorX += w + GAP;
    rowMaxZ = Math.max(rowMaxZ, d);
    layerMaxY = Math.max(layerMaxY, h);
  }

  return placements;
}

export function splitItemsByTruckLoad(items, trucksExpanded) {
  const buckets = trucksExpanded.map(() => []);
  const acc = trucksExpanded.map(() => 0);

  for (const it of items) {
    const cbm = itemCbm(it);
    const candidates = trucksExpanded
      .map((t, idx) => ({ t, idx }))
      .filter(({ t }) => canFitInTruck(it, t));

    if (!candidates.length) continue;

    let chosen = candidates[0].idx;
    let bestScore = Infinity;

    for (const { t, idx } of candidates) {
      const target = Math.max(0, toNumber(t.loadCbm, 0));
      const after = acc[idx] + cbm;
      const score = Math.abs(after - target);
      if (score < bestScore) {
        bestScore = score;
        chosen = idx;
      }
    }

    buckets[chosen].push(it);
    acc[chosen] += cbm;
  }

  const remainder = items.filter((it) => !trucksExpanded.some((t) => canFitInTruck(it, t)));
  return { buckets, remainder };
}
