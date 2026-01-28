from __future__ import annotations

from typing import Optional, Dict
from django.db import transaction

from estimates.models import EstimatePrice, EstimatePriceSection, EstimatePriceLine
from policy.models import BasePrice

from .context import EstimateContext
from .pricing_access import calc_access_cost, AccessPricingError
from .pricing_distance import calc_distance_cost, DistancePricingError
from .pricing_special import calc_special_cost, SpecialPricingError



class PricingError(Exception):
  """견적 요금 산출 중 정책 누락/데이터 오류 등으로 실패할 때 사용."""


def _pick_main_truck_type(ctx: EstimateContext) -> Optional[str]:
  """
  트럭 선정 시 큰 트럭 기준으로 먼저 사용
  예: 5T -> 2.5T + 2.5T으로 분리해서 사용하지 않고 5T을 사용
  """
  plans = ctx.truck_plans or []
  if not plans:
    return None

  def rank(truck_type: str) -> float:
    mapping = {"1T": 1.0, "2_5T": 2.5, "5T": 5.0, "6T": 6.0, "7_5T": 7.5, "10T": 10.0}
    return mapping.get(truck_type, 0.0)

  return max((p.truck_type for p in plans if p.truck_type), key=rank)


def _get_or_create_access_section(price: EstimatePrice, sec_key: str) -> EstimatePriceSection:
  """
  접근비용 섹션에서 key(LADDER/STAIRS)별로 1개만 유지하고 금액 누적
  """
  if sec_key == "LADDER":
    key_enum = EstimatePriceSection.Key.LADDER
    title = "사다리차 추가 비용"
  else:
    key_enum = EstimatePriceSection.Key.STAIRS
    title = "계단 추가 비용"

  section, _ = EstimatePriceSection.objects.get_or_create(
    estimate_price=price,
    key=key_enum,
    defaults={"title": title, "amount": 0, "description": None},
  )
  return section



def _move_type_label(move_type: str) -> str:
  mapping = {
    "PACKING": "포장이사",
    "GENERAL": "일반이사",
  }
  return mapping.get(move_type, move_type)


def _truck_type_label(truck_type: str) -> str:
  # "2_5T" -> "2.5톤", "7_5T" -> "7.5톤", "1T" -> "1톤"
  if not truck_type:
    return ""
  if truck_type.endswith("T"):
    core = truck_type[:-1].replace("_", ".")
    return f"{core}톤"
  return truck_type



@transaction.atomic
def build_pricing(ctx: EstimateContext) -> Dict[str, int]:
  """
  견적 요금(EstimatePrice) 산출/저장 오케스트레이터.

  산출식: 총 견적 = ① 기본요금 + ② 출발지 접근비용 + ③ 도착지 접근비용 + ④ 거리 비용 + ⑤ 특수가구 비용

  ① 기본요금 (policy_baseprice)
    - 기준: (이사 종류 move_type) + (대표 트럭 타입 main_truck_type)
    - 대표 트럭 타입은 ctx.truck_plans 중 '가장 큰 트럭'으로 결정

  ②+③ 출발지 or 도착지 접근비용 (ladder_fee_rule or stairs_fee_rule)
    - Case 1) 사다리 사용(use_ladder=True) -> ladder_fee_rule (엘베 여부 무관)
    - Case 2) 사다리 미사용 + 엘리베이터 가능 -> 0
    - Case 3) 사다리 미사용 + 엘리베이터 불가 -> stairs_fee_rule
    - 도착지 정보가 없으면(혹은 dest_* 값이 누락되면) 도착지 접근비용은 0으로 처리

  ④ 거리 비용 (distance_fee_rule)
    - 기준: distance_km 초과분 정책 적용 (예: 기본 20km 이내 0, 초과 시 10km 단위 과금 등)
    - 대표 트럭 타입 기준으로 요금 테이블 조회

  ⑤ 특수 옵션 비용 (special_item_fee)
    - 기준: 사용자가 선택한 특수 옵션(분해/조립/설치 등) 합산
    - 현재 ctx.items(EstimateItem 스냅샷)와 추후 옵션 입력 모델을 기반으로 라인아이템 생성

  저장 규칙:
    - EstimatePrice: estimate 1:1
    - EstimatePriceSection: BASE / ACCESS / DISTANCE / SPECIAL 등 섹션 단위 저장
    - EstimatePriceLine: 섹션 내 상세 라인(출발/도착, 가구별 옵션 등) 저장
  """




  # ====================================
  # 0) Estimate, EstimatePrice가져오기
  # ====================================
  estimate = ctx.estimate
  try:
    price = estimate.price
  except EstimatePrice.DoesNotExist:
    raise PricingError("EstimatePrice does not exist. Create it before build_pricing().")

  # EstimatePriceSection, EstimatePriceLine 초기화 
  EstimatePriceLine.objects.filter(estimate_price_section__estimate_price=price).delete()
  EstimatePriceSection.objects.filter(estimate_price=price).delete()

  total_amount = 0
  special_item_count = 0



  # ====================================
  # 1) 기본요금
  # ====================================
  main_truck_type = _pick_main_truck_type(ctx)
  if main_truck_type is None:
    raise PricingError("main_truck_type could not be determined (no truck_plans).")

  base_rule = (
    BasePrice.objects
    .filter(
      move_type=estimate.move_type,
      truck_type=main_truck_type,
      is_active=True,
    )
    .first()
  )

  if base_rule is None:
    raise PricingError(f"BasePrice not found (move_type={estimate.move_type}, truck_type={main_truck_type})")

  move_label = _move_type_label(estimate.move_type)
  truck_label = _truck_type_label(main_truck_type)

  EstimatePriceSection.objects.create(
    estimate_price=price,
    key=EstimatePriceSection.Key.BASE,
    title="기본 요금",
    amount=int(base_rule.base_amount),
    description=f"{move_label} {truck_label} 기준",
  )
  total_amount += int(base_rule.base_amount)



  # ====================================
  # 2) 출발지 접근비용 (pricing_access.py)
  # ====================================
  # Case 1) 사다리 사용(use_ladder=True) -> ladder_fee_rule (엘베 여부 무관)
  # Case 2) 사다리 미사용 + 엘리베이터 가능 -> 0
  # Case 3) 사다리 미사용 + 엘리베이터 불가 -> stairs_fee_rule
  try:
    sec_key, origin_amt, origin_lines = calc_access_cost(
      scope="ORIGIN",
      floor=estimate.origin_floor,
      has_elevator=estimate.origin_has_elevator,
      use_ladder=estimate.origin_use_ladder,
      main_truck_type=main_truck_type,
    )
  except AccessPricingError as e:
    raise PricingError(str(e))
  
  # 금액이 있는 경우만 DB에 저장
  if origin_amt > 0 or origin_lines:
    origin_section = _get_or_create_access_section(price, sec_key)

    # 위에 저장한 section id에 priceLine 저장
    EstimatePriceLine.objects.bulk_create([
      EstimatePriceLine(
        estimate_price_section=origin_section,
        scope="ORIGIN",
        furniture_id=None,
        name_kr=None,
        amount=int(ln.amount),
        description=ln.description or None,
      )
      for ln in origin_lines
    ])

    origin_section.amount = int(origin_section.amount) + int(origin_amt)
    origin_section.save(update_fields=["amount"])

    total_amount += int(origin_amt)



  # ====================================
  # 3) 도착지 접근비용 (pricing_access.py)
  # ====================================
  # Case 0) 도착지 없음 -> 0
  # Case 1) 사다리 사용(use_ladder=True) -> ladder_fee_rule (엘베 여부 무관)
  # Case 2) 사다리 미사용 + 엘리베이터 가능 -> 0
  # Case 3) 사다리 미사용 + 엘리베이터 불가 -> stairs_fee_rule

  # 도착지 정보가 없는 경우 None
  has_dest = bool(estimate.dest_address) and (estimate.dest_floor is not None)

  if has_dest :
    try:
      sec_key, dest_amt, dest_lines = calc_access_cost(
        scope = "DEST",
        floor = estimate.dest_floor,
        has_elevator = estimate.dest_has_elevator,
        use_ladder = estimate.dest_use_ladder,
        main_truck_type = main_truck_type,
      )
    except AccessPricingError as e :
      raise PricingError(str(e))

    if dest_amt > 0 or dest_lines :
      dest_section = _get_or_create_access_section(price, sec_key)

      EstimatePriceLine.objects.bulk_create([
        EstimatePriceLine(
          estimate_price_section = dest_section,
          scope = "DEST",
          furniture_id=None,
          name_kr=None,
          amount=int(ln.amount),
          description=ln.description or None,
        )
        for ln in dest_lines
      ])

      dest_section.amount = int(dest_section.amount) + int(dest_amt)
      dest_section.save(update_fields=["amount"])

      total_amount += int(dest_amt)



  # ====================================
  # 4) 거리 비용 (pricing_distance.py)
  # ====================================
  # 기준:
  #   - price.distance_km 초과분에 대해 정책 적용
  #   - 기본 거리 이내는 0원
  #   - 초과 시 unit_km 단위로 과금
  #
  # 대표 트럭 타입(main_truck_type) 기준 요금 테이블 사용
  # ====================================
  # 4) 거리 비용 (pricing_distance.py)
  # ====================================
  
  try:
    distance_amt, distance_desc = calc_distance_cost(
      distance_km=estimate.price.distance_km,
      truck_type=main_truck_type,
    )
  except DistancePricingError as e:
    raise PricingError(str(e))

  EstimatePriceSection.objects.create(
    estimate_price=price,
    key=EstimatePriceSection.Key.DISTANCE,
    title="거리 추가 비용",
    amount=int(distance_amt),
    description=distance_desc,
  )
  total_amount += int(distance_amt)



  # ====================================
  # 5) 특수 옵션 비용 (pricing_special.py)
  # ====================================
  try:
    special_amt, special_cnt, special_lines = calc_special_cost(ctx)
  except SpecialPricingError as e:
    raise PricingError(str(e))

  if special_amt > 0 or special_lines:
    special_section = EstimatePriceSection.objects.create(
      estimate_price=price,
      key=EstimatePriceSection.Key.SPECIAL,
      title="특수가구 추가 비용",
      amount=int(special_amt),
    )

    EstimatePriceLine.objects.bulk_create([
      EstimatePriceLine(
        estimate_price_section=special_section,
        scope="SPECIAL",
        furniture_id=ln.furniture_id,
        name_kr=ln.name_kr,
        amount=int(ln.amount),
        description=ln.description or None,
      )
      for ln in special_lines
    ])

    total_amount += int(special_amt)
    special_item_count += int(special_cnt)



  # ====================================
  # 6) 산출 결과 반환
  # ====================================
  return {
    "total_amount": total_amount,
    "special_item_count": special_item_count,
  }
