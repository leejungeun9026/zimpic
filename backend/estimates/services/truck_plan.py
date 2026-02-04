# estimates/services/truck_plan.py
from __future__ import annotations

from dataclasses import dataclass, replace
from decimal import Decimal, ROUND_HALF_UP
from typing import List, Tuple, Dict, Any, Optional

from django.db import transaction

from estimates.models import Estimate, EstimateTruckPlan, EstimateItem
from policy.models import TruckSpec, BoxRule, Furniture


Q2 = Decimal("0.01")
Q1 = Decimal("0.1")


def d2(x: Decimal) -> Decimal:
    return x.quantize(Q2, rounding=ROUND_HALF_UP)


def p1(x: Decimal) -> Decimal:
    return x.quantize(Q1, rounding=ROUND_HALF_UP)


def to_decimal(x) -> Decimal:
    return Decimal(str(x))


@dataclass
class VirtualItem:
    w: Decimal
    d: Decimal
    h: Decimal
    stackable: bool
    can_stack_on_top: bool
    rotations: List[str]

    @property
    def volume_cbm(self) -> Decimal:
        return (self.w * self.d * self.h) / Decimal("1000000")


TRUCK_COMBINATIONS: List[List[str]] = [
    ["1T"],
    ["2_5T"],
    ["5T"],
    ["5T", "1T"],
    ["5T", "2_5T"],
    ["5T", "5T"],
    ["5T", "5T", "1T"],
    ["5T", "5T", "2_5T"],
]


# ------------------------------
# Packing feasibility helpers
# ------------------------------
def _oriented_variants(item: VirtualItem) -> List[VirtualItem]:
    """
    rotations: ["WDH", "DWH", ...] 형태라고 가정.
    (기존 코드에서 allowed_rotations_json이 이런 형태로 들어온다는 전제)
    """
    out: List[VirtualItem] = []
    for r in (item.rotations or ["WDH"]):
        r = str(r).upper()
        if len(r) != 3:
            continue

        mapping = {"W": item.w, "D": item.d, "H": item.h}
        try:
            nw = mapping[r[0]]
            nd = mapping[r[1]]
            nh = mapping[r[2]]
        except Exception:
            continue

        out.append(replace(item, w=nw, d=nd, h=nh))
    return out


def _pick_best_orientation_for_truck(
    item: VirtualItem,
    *,
    bin_w: Decimal,
    bin_d: Decimal,
    max_h: Decimal,
) -> Optional[VirtualItem]:
    """
    - 높이(max_h) 안에 들어가고
    - 바닥(bin_w/bin_d) 안에 들어가고
    - footprint(면적) 작은 방향 우선
    """
    candidates = []
    for v in _oriented_variants(item):
        if v.h <= max_h and v.w <= bin_w and v.d <= bin_d:
            candidates.append(v)
    if not candidates:
        return None
    candidates.sort(key=lambda x: (x.w * x.d, x.h))
    return candidates[0]


def _merge_stackables_for_truck(
    items: List[VirtualItem],
    *,
    max_h: Decimal,
) -> List[VirtualItem]:
    """
    아주 단순한 "1단 스택 합성" 근사:
    - base(can_stack_on_top=True) 위에 top(stackable=True) 1개만 올림
    - top footprint가 base footprint 안에 들어가고
    - base.h + top.h <= max_h

    합성 후: footprint는 base 유지, 높이만 합산.
    """
    bases = [i for i in items if i.can_stack_on_top]
    others = [i for i in items if i not in bases]

    tops = [i for i in items if i.stackable]
    used_top_ids = set()

    bases.sort(key=lambda x: (x.w * x.d), reverse=True)
    tops.sort(key=lambda x: (x.w * x.d))  # 작은 것부터 얹기

    merged: List[VirtualItem] = []
    for b in bases:
        cur = b
        chosen_top = None
        for t in tops:
            if id(t) in used_top_ids:
                continue
            if t is b:
                continue
            if t.w <= cur.w and t.d <= cur.d and (cur.h + t.h) <= max_h:
                chosen_top = t
                break

        if chosen_top is not None:
            used_top_ids.add(id(chosen_top))
            cur = VirtualItem(
                w=cur.w,
                d=cur.d,
                h=cur.h + chosen_top.h,
                stackable=cur.stackable,
                can_stack_on_top=cur.can_stack_on_top,
                rotations=["WDH"],  # 합성은 고정 취급(단순화)
            )
        merged.append(cur)

    # top으로 사용된 것 제거
    filtered_others: List[VirtualItem] = []
    for x in others:
        if id(x) in used_top_ids:
            continue
        filtered_others.append(x)

    return merged + filtered_others


def _shelf_pack_subset(
    items: List[VirtualItem],
    *,
    bin_w: Decimal,
    bin_d: Decimal,
) -> Tuple[List[VirtualItem], List[VirtualItem]]:
    """
    Shelf(행) 기반 2D packing (부분 적재 지원):
    - items를 (면적 큰 순)으로 순회
    - 들어가면 packed에 넣고, 못 들어가면 remaining에 남김
    - "행(row)"을 bin_w 방향으로 채우고, 행 높이(row_d)를 bin_d로 누적

    반환:
    - packed: 이번 트럭에 들어간 아이템
    - remaining: 못 들어간 아이템
    """
    # 큰 것부터 넣기
    candidates = sorted(items, key=lambda x: (x.w * x.d), reverse=True)

    packed: List[VirtualItem] = []
    remaining: List[VirtualItem] = []

    x_used = Decimal("0")
    y_used = Decimal("0")
    row_d = Decimal("0")

    for it in candidates:
        # 아이템이 바닥 자체에 안 들어가면 무조건 남김
        if it.w > bin_w or it.d > bin_d:
            remaining.append(it)
            continue

        # 현재 row에 배치 가능?
        if x_used + it.w <= bin_w:
            packed.append(it)
            x_used += it.w
            row_d = max(row_d, it.d)
            continue

        # 새 row로 내릴 수 있는지
        new_y = y_used + row_d
        if new_y + it.d <= bin_d:
            y_used = new_y
            x_used = it.w
            row_d = it.d
            packed.append(it)
            continue

        # 이번 트럭엔 못 넣음
        remaining.append(it)

    # 원래 순서가 아니라 정렬 기반이라, remaining에도 "못 넣은 것"이 담김
    return packed, remaining


def can_pack_combo(items: List[VirtualItem], specs: List[TruckSpec]) -> bool:
    """
    combo(여러 트럭)에 대해:
    - 각 트럭마다 (회전/높이/쌓기/바닥배치) 고려하여
      "일부라도" 넣고 남은 아이템을 다음 트럭으로 넘김.
    """
    remaining = items[:]

    for spec in specs:
        if not remaining:
            return True

        bin_w = to_decimal(spec.inner_width_cm)
        bin_d = to_decimal(spec.inner_length_cm)
        max_h = to_decimal(spec.inner_height_cm)

        # 1) 회전/높이/바닥 사이즈로 필터 + best orientation 선택
        oriented: List[VirtualItem] = []
        hard_fail = False
        for it in remaining:
            best = _pick_best_orientation_for_truck(it, bin_w=bin_w, bin_d=bin_d, max_h=max_h)
            if best is None:
                # 이 트럭에는 아예 못 들어가는 아이템(회전해도/높이도/바닥도 불가)
                oriented.append(it)  # 일단 유지(다음 큰 트럭에서 들어갈 수 있으니)
            else:
                oriented.append(best)

        # 2) 쌓기(근사) 적용 (이번 트럭 적재를 유리하게)
        merged = _merge_stackables_for_truck(oriented, max_h=max_h)

        # 3) 2D shelf로 "부분 적재" 수행
        packed, not_packed = _shelf_pack_subset(merged, bin_w=bin_w, bin_d=bin_d)

        if not packed:
            # 이번 트럭에 아무것도 못 넣으면(= 트럭이 너무 작거나 배치 실패)
            # 다음 트럭(더 큰 트럭)이 있을 수 있으니,
            # "현재 트럭으로는 진행 불가"로 처리해야 함.
            # -> combo 자체 실패 처리 (현실적으로 트럭 순서를 바꿔야 하는데 combo는 정해진 순서라)
            return False

        remaining = not_packed

    return not remaining


# ------------------------------
# Main: build_truck_plan
# ------------------------------
@transaction.atomic
def build_truck_plan(
    *,
    estimate: Estimate,
    item_snapshots: List[EstimateItem],
    box_rule: BoxRule,
    box_furniture: Furniture,
    box_rotations: List[str],
    truck_specs: Dict[str, TruckSpec],
) -> Tuple[List[EstimateTruckPlan], Dict[str, Any]]:
    """
    반환:
    - plans: 생성된 EstimateTruckPlan 리스트
    - summary: EstimatePrice에 저장할 계산 요약 스냅샷(dict)

    변경점:
    - "CBM만"으로 combo를 통과시키지 않고,
      (가로/세로/높이/회전/쌓기 가능)까지 고려한 feasibility 체크(can_pack_combo)를 통과한 combo만 채택
    - 응답값(summary/plan 필드)은 기존 그대로 유지
    """

    # 1) 기존 item_snapshots -> VirtualItem
    items: List[VirtualItem] = []
    for it in item_snapshots:
        rotations = (getattr(it, "allowed_rotations_json", None) or ["WDH"])
        items.append(
            VirtualItem(
                w=to_decimal(it.packed_w_cm),
                d=to_decimal(it.packed_d_cm),
                h=to_decimal(it.packed_h_cm),
                stackable=bool(it.stackable),
                can_stack_on_top=bool(it.can_stack_on_top),
                rotations=rotations,
            )
        )

    # 2) 박스 rule -> 박스 VirtualItem 추가
    boxes_count = int(box_rule.boxes_min)
    boxes_description = f"{estimate.area}평 기준, 이사 박스(5호) 평균 {boxes_count}개를 기준으로 계산했어요."

    bw = to_decimal(box_furniture.width_cm) + to_decimal(box_furniture.padding_cm) * 2
    bd = to_decimal(box_furniture.depth_cm) + to_decimal(box_furniture.padding_cm) * 2
    bh = to_decimal(box_furniture.height_cm) + to_decimal(box_furniture.padding_cm) * 2

    rot = box_rotations or ["WDH"]
    for _ in range(boxes_count):
        items.append(
            VirtualItem(
                w=bw,
                d=bd,
                h=bh,
                stackable=bool(box_furniture.stackable),
                can_stack_on_top=bool(box_furniture.can_stack_on_top),
                rotations=rot,
            )
        )

    # 3) total cbm
    total_cbm = d2(sum((i.volume_cbm for i in items), Decimal("0")))

    # 4) 후보 조합 탐색
    for combo in TRUCK_COMBINATIONS:
        specs = [truck_specs.get(t) for t in combo]
        if any(s is None for s in specs):
            continue

        # (A) 1차: CBM 통과 (기존 로직 유지)
        total_capacity = d2(sum((to_decimal(s.cbm_geom) for s in specs), Decimal("0")))
        if total_capacity < total_cbm:
            continue

        # (B) 2차: 3D(근사) feasibility 체크 (가로/세로/높이/회전/쌓기)
        if not can_pack_combo(items, specs):
            continue

        # (C) 통과한 combo 중 첫 번째 채택 (기존 구조 유지)
        remaining_to_assign = total_cbm
        per_truck_metrics: List[dict] = []

        for s in specs:
            cap = d2(to_decimal(s.cbm_geom))
            load = cap if remaining_to_assign >= cap else remaining_to_assign
            load = d2(load)
            remaining_to_assign = d2(remaining_to_assign - load)

            factor = Decimal("0.0") if cap == 0 else p1((load / cap) * Decimal("100"))

            per_truck_metrics.append(
                {
                    "capacity_cbm": cap,
                    "load_cbm": load,
                    "load_factor_pct": factor,
                    "remaining_cbm": d2(cap - load),
                }
            )

        recommended_ton = to_decimal(_calc_recommended_ton(combo))
        remaining_cbm = d2(total_capacity - total_cbm)
        load_factor_pct = p1((total_cbm / total_capacity) * Decimal("100")) if total_capacity else Decimal("0.0")

        summary = {
            "boxes_count": boxes_count,
            "boxes_description": boxes_description,
            "recommended_ton": recommended_ton,
            "total_cbm": total_cbm,
            "truck_capacity_cbm": total_capacity,
            "load_factor_pct": load_factor_pct,
            "remaining_cbm": remaining_cbm,
        }

        objs: List[EstimateTruckPlan] = []
        for truck_type, spec, m in zip(combo, specs, per_truck_metrics):
            objs.append(
                EstimateTruckPlan(
                    estimate=estimate,
                    truck_type=truck_type,
                    truck_count=1,
                    inner_w_cm=to_decimal(spec.inner_width_cm),
                    inner_d_cm=to_decimal(spec.inner_length_cm),
                    inner_h_cm=to_decimal(spec.inner_height_cm),
                    capacity_cbm=m["capacity_cbm"],
                    load_cbm=m["load_cbm"],
                    load_factor_pct=m["load_factor_pct"],
                    remaining_cbm=m["remaining_cbm"],
                )
            )
        EstimateTruckPlan.objects.bulk_create(objs)
        return objs, summary

    raise ValueError("No suitable truck combination found")


def _calc_recommended_ton(combo: List[str]) -> Decimal:
    mapping = {"1T": Decimal("1.0"), "2_5T": Decimal("2.5"), "5T": Decimal("5.0")}
    total = Decimal("0.0")
    for t in combo:
        total += mapping.get(t, Decimal("0.0"))
    return total
