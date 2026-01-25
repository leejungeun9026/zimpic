from __future__ import annotations

from typing import Dict, List, Tuple
from decimal import Decimal

from policy.models import Furniture, FurnitureRotation


def build_furniture_maps(furniture_ids: List[int]) -> Tuple[Dict[int, Furniture], Dict[int, List[str]]]:
  """
  furniture_ids를 한 번에 조회해서
  - furniture_map: {furniture_id: Furniture}
  - rotation_map: {furniture_id: [orientation_code, ...]}
  반환
  """
  unique_ids = list(set(furniture_ids))

  furniture_map = {
      f.id: f for f in Furniture.objects.filter(id__in=unique_ids)
  }

  rotation_map: Dict[int, List[str]] = {}
  qs = (
      FurnitureRotation.objects
      .filter(furniture_id__in=unique_ids)
      .values("furniture_id", "orientation_code")
  )

  for row in qs:
      fid = row["furniture_id"]
      rotation_map.setdefault(fid, []).append(row["orientation_code"])

  # 중복 제거 + 정렬(응답 안정성)
  for fid, codes in rotation_map.items():
      rotation_map[fid] = sorted(list(set(codes)))

  return furniture_map, rotation_map


def compute_item_snapshot(
  furniture: Furniture,
  w_cm: float,
  d_cm: float,
  h_cm: float,
  needs_disassembly: bool,
  rotation_codes: List[str],
) -> dict:
  """
  유저 입력(w/d/h, needs_disassembly) + DB 데이터(Furniture, FurnitureRotation)로 EstimateItem에 넣을 스냅샷 dict 생성
  """
  padding = float(furniture.padding_cm)
  packed_w = w_cm + padding * 2
  packed_d = d_cm + padding * 2
  packed_h = h_cm + padding * 2

  return {
    # 유저 입력
    "w_cm": w_cm,
    "d_cm": d_cm,
    "h_cm": h_cm,
    "needs_disassembly": needs_disassembly,

    # DB 데이터 스냅샷
    "padding_cm": padding,
    "packed_w_cm": packed_w,
    "packed_d_cm": packed_d,
    "packed_h_cm": packed_h,
    "stackable": bool(furniture.stackable),
    "can_stack_on_top": bool(furniture.can_stack_on_top),
    "allowed_rotations_json": rotation_codes,
  }
