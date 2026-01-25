# estimates/services/truck_plan.py
def build_truck_plan_for_estimate(estimate_id: int) -> None:
  """
  TODO:
  - EstimateItem packed 기준 CBM 합산
  - BoxRule(평수) -> 박스 개수
  - box(Furniture name_en="box") 부피 * box_count 추가
  - 적재 보정치 적용
  - TruckSpec 조합(5+1, 5+2.5, 5+5 등) 선택
  - Estimate.recommended_ton 저장
  - EstimateTruckPlan 생성
  """
  raise NotImplementedError
