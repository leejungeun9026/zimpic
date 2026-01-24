from django.db import models
from django.db.models import UniqueConstraint
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError


class FurnitureCategory(models.TextChoices):
  GENERAL_APPLIANCE = "GENERAL_APPLIANCE", "GENERAL_APPLIANCE (일반가전)"
  KITCHEN_APPLIANCE = "KITCHEN_APPLIANCE", "KITCHEN_APPLIANCE (주방가전)"
  GENERAL_FURNITURE = "GENERAL_FURNITURE", "GENERAL_FURNITURE (일반가구)"
  SPECIAL_FURNITURE = "SPECIAL_FURNITURE", "SPECIAL_FURNITURE (특수가구)"
  ETC = "ETC", "기타"

class RotationCode(models.TextChoices):
  WHD = "WHD", "WHD (바닥면=WXH, 높이=D)"
  WDH = "WDH", "WDH (바닥면=WXD, 높이=H)"
  HWD = "HWD", "HWD (바닥면=HXW, 높이=D)"
  HDW = "HDW", "HDW (바닥면=HXD, 높이=W)"
  DWH = "DWH", "DWH (바닥면=DXW, 높이=H)"
  DHW = "DHW", "DHW (바닥면=DXH, 높이=W)"

class TruckType(models.TextChoices):
  T1 = "1T", "1T"
  T2_5 = "2_5T", "2_5T"
  T5 = "5T", "5T"
  T6 = "6T", "6T"
  T7_5 = "7_5T", "7.5T"
  T10 = "10T", "10T"

class BodyType(models.TextChoices):
  CARGO = "CARGO", "CARGO(카고)"
  TOP = "TOP", "TOP(탑차)"

class MoveType(models.TextChoices):
  GENERAL = "GENERAL", "GENERAL(일반이사)"
  PACKING = "PACKING", "PACKING(포장이사)"



class Furniture(models.Model):
  """
  가구/가전 데이터
  """
  category = models.CharField(max_length=20, choices=FurnitureCategory.choices)
  
  yolo_id = models.IntegerField(null=True, blank=True, unique=True)

  name_en = models.CharField(max_length=64, unique=True)  # snake_case 내부 키
  name_kr = models.CharField(max_length=64)

  description = models.CharField(max_length=255, null=True, blank=True)
  reference_model = models.CharField(max_length=255, null=True, blank=True)
  reference_url = models.URLField(max_length=500, null=True, blank=True)

  width_cm = models.PositiveIntegerField(validators=[MinValueValidator(1)])
  depth_cm = models.PositiveIntegerField(validators=[MinValueValidator(1)])
  height_cm = models.PositiveIntegerField(validators=[MinValueValidator(1)])

  # DECIMAL(4,2) 느낌으로: max_digits=4, decimal_places=2
  padding_cm = models.DecimalField(
    max_digits=4,
    decimal_places=1,
    default=0.0,
    validators=[MinValueValidator(0.0), MaxValueValidator(10.0)],
    help_text="포장재 두께(cm, 사방 적용)",
  )

  needs_disassembly = models.BooleanField(default=False)

  stackable = models.BooleanField(
    default=False,
    help_text="이 물건을 다른 물건 위에 올릴 수 있는지 (True=다른 물건 위에 쌓아도 됨 / False=다른 물건 위에 쌓으면 안됨)",
  )
  can_stack_on_top = models.BooleanField(
    default=False,
    help_text="이 물건 위에 다른 걸 올려도 되는지 여부 (True=위에 다른물건을 올려도 됨 / False=위에 다른 물건을 올릴 수 없음)",
  )

  class Meta:
    verbose_name = "가구"
    verbose_name_plural = "1. 가구 목록"
    indexes = [
      models.Index(fields=["category"]),
      models.Index(fields=["name_en"]),
    ]

  def __str__(self):
    return f"{self.name_kr} ({self.name_en})"



class FurnitureRotation(models.Model):
  """
  가구 회전 가능 데이터
  """
  furniture = models.ForeignKey(
    Furniture,
    on_delete=models.CASCADE,
    related_name="rotations",
    db_column="furniture_id",
  )
  orientation_code = models.CharField(max_length=3, choices=RotationCode.choices)
  note = models.CharField(max_length=100, null=True, blank=True)

  class Meta:
    verbose_name = "가구 회전"
    verbose_name_plural = "2. 가구 회전 목록"
    constraints = [
      UniqueConstraint(
        fields=["furniture", "orientation_code"],
        name="uq_policy_furniture_rotation_furniture_orientation",
      )
    ]
    indexes = [
      models.Index(fields=["furniture"]),
      models.Index(fields=["orientation_code"]),
    ]

  def __str__(self):
    return f"{self.furniture.name_en} - {self.orientation_code}"




class BoxRule(models.Model):
  """
  평수 기반 박스 개수
  """
  area_min_py = models.PositiveSmallIntegerField(
      validators=[MinValueValidator(1)],
      help_text="구간 시작 평수 (포함)",
  )
  area_max_py = models.PositiveSmallIntegerField(
      validators=[MinValueValidator(1)],
      help_text="구간 끝 평수 (포함)",
  )

  boxes_min = models.PositiveSmallIntegerField(help_text="박스 최소")
  boxes_max = models.PositiveSmallIntegerField(help_text="박스 최대")
  boxes_avg = models.PositiveSmallIntegerField(help_text="기본값")

  note = models.CharField(max_length=100, help_text="평수 표시용 라벨")

  is_active = models.BooleanField(default=True)

  class Meta:
    verbose_name = "평수별 박스 개수"
    verbose_name_plural = "3. 평수별 박스 개수 목록"
    ordering = ("area_min_py",)

  def clean(self):
    # 기본 범위 검증
    if self.area_min_py > self.area_max_py:
      raise ValidationError("area_min_py는 area_max_py보다 클 수 없습니다.")

    if not (self.boxes_min <= self.boxes_avg <= self.boxes_max):
      raise ValidationError("boxes_avg는 boxes_min~boxes_max 범위 안에 있어야 합니다.")

    # 평수 구간 겹침 방지
    qs = BoxRule.objects.filter(is_active=True)
    if self.pk:
      qs = qs.exclude(pk=self.pk)

    if qs.filter(
      area_min_py__lte=self.area_max_py,
      area_max_py__gte=self.area_min_py,
    ).exists():
      raise ValidationError("다른 박스 산정 룰과 평수 구간이 겹칩니다.")

  def __str__(self):
    return f"{self.area_min_py}~{self.area_max_py}평 ({self.note})"



class TruckSpec(models.Model):
  """
  트럭 적재함 스펙(내측 치수)
  """
  truck_type = models.CharField(
    max_length=10,
    choices=TruckType.choices,   # 이미 만들어둔 TruckType (1T,2_5T,5T...)
    unique=True,
  )
  name = models.CharField(max_length=50)
  body_type = models.CharField(max_length=10, choices=BodyType.choices)

  inner_width_cm = models.PositiveSmallIntegerField(validators=[MinValueValidator(1)])
  inner_length_cm = models.PositiveSmallIntegerField(validators=[MinValueValidator(1)])
  inner_height_cm = models.PositiveSmallIntegerField(validators=[MinValueValidator(1)])

  cbm_geom = models.PositiveSmallIntegerField(
    validators=[MinValueValidator(1)],
    help_text="세제곱미터, 1CBM = 1m*1m*1m",
  )

  is_active = models.BooleanField(default=True)

  class Meta:
    verbose_name = "트럭 적재함 스펙"
    verbose_name_plural = "4. 트럭 적재함 스펙 목록"
    indexes = [
      models.Index(fields=["truck_type"]),
      models.Index(fields=["is_active"]),
    ]

  def __str__(self):
    return f"{self.name}({self.truck_type}) {self.inner_width_cm}x{self.inner_length_cm}x{self.inner_height_cm}cm"
  


class BasePrice(models.Model):
  """
  기본 요금
  """
  move_type = models.CharField(max_length=20, choices=MoveType.choices)
  truck_type = models.CharField(max_length=10, choices=TruckType.choices)
  base_amount = models.PositiveIntegerField(validators=[MinValueValidator(0)])
  included_workers = models.PositiveSmallIntegerField(default=0)
  note = models.CharField(
    max_length=200, 
    blank=True, 
    default="",
    help_text="기준 인원 작성 (예: 남5+여2)",)

  is_active = models.BooleanField(default=True)

  class Meta:
    verbose_name = "기본 요금"
    verbose_name_plural = "5. 기본 요금 목록"
    unique_together = [("move_type", "truck_type")]
    indexes = [
      models.Index(fields=["move_type", "truck_type"]),
      models.Index(fields=["is_active"]),
    ]

  def __str__(self):
    return f"[{self.move_type}] {self.truck_type} - {self.base_amount}원"



class LadderFeeRule(models.Model):
  """
  사다리차 요금
  """
  ladder_truck_group = models.CharField(max_length=10, choices=TruckType.choices)
  floor_from = models.PositiveSmallIntegerField()
  floor_to = models.PositiveSmallIntegerField()
  base_amount = models.PositiveIntegerField(validators=[MinValueValidator(0)])

  is_active = models.BooleanField(default=True)

  class Meta:
    verbose_name = "사다리차 요금"
    verbose_name_plural = "6. 사다리차 요금 목록"
    unique_together = [("ladder_truck_group", "floor_from", "floor_to")]
    indexes = [
      models.Index(fields=["ladder_truck_group", "floor_from", "floor_to"]),
      models.Index(fields=["is_active"]),
    ]

  def __str__(self):
    return f"{self.ladder_truck_group} {self.floor_from}-{self.floor_to}F: {self.base_amount}원"


class StairsFeeRule(models.Model):
  """
  계단 요금
  """
  floor_from = models.PositiveSmallIntegerField()
  floor_to = models.PositiveSmallIntegerField()
  per_floor_amount = models.PositiveIntegerField(validators=[MinValueValidator(0)])  # 원/층

  is_active = models.BooleanField(default=True)

  class Meta:
    verbose_name = "계단 요금"
    verbose_name_plural = "7. 계단 요금 목록"
    unique_together = [("floor_from", "floor_to")]
    indexes = [
      models.Index(fields=["floor_from", "floor_to"]),
      models.Index(fields=["is_active"]),
  ]

  def __str__(self):
    return f"{self.floor_from}-{self.floor_to}F: {self.per_floor_amount}원/층"


class DistanceFeeRule(models.Model):
  """
  거리 요금
  """
  truck_type = models.CharField(max_length=10, choices=TruckType.choices, unique=True,)
  base_km = models.PositiveSmallIntegerField(default=20)
  unit_km = models.PositiveSmallIntegerField(default=10)
  per_unit_amount = models.PositiveIntegerField(validators=[MinValueValidator(0)])  # 원/단위

  is_active = models.BooleanField(default=True)

  class Meta:
    verbose_name = "거리 요금"
    verbose_name_plural = "8. 거리 요금 목록"
    unique_together = [("truck_type", "base_km", "unit_km")]
    indexes = [
      models.Index(fields=["truck_type"]),
      models.Index(fields=["is_active"]),
    ]

  def __str__(self):
    return f"{self.truck_type}: {self.base_km}km+ {self.unit_km}km당 {self.per_unit_amount}원"



class SpecialItemFee(models.Model):
  """
  특수가구 요금
  """
  furniture = models.ForeignKey(
    Furniture,
    on_delete=models.CASCADE,
    related_name="special_fees",
    db_column="furniture_id",
  )
  description = models.CharField(max_length=255)
  unit_amount = models.PositiveIntegerField(validators=[MinValueValidator(0)])
  is_active = models.BooleanField(default=True)

  class Meta:
    constraints = [
      models.UniqueConstraint(fields=["furniture"], name="uq_special_fee_furniture"),
    ]
    verbose_name = "특수가구 요금"
    verbose_name_plural = "9. 특수가구 요금 목록"
    indexes = [
      models.Index(fields=["furniture"]),
      models.Index(fields=["is_active"]),
    ]

  def __str__(self):
    return f"{self.furniture.name_en}({self.description}) - {self.unit_amount}원"