import uuid
from django.db import models


class Estimate(models.Model):
  class MoveType(models.TextChoices):
    GENERAL = "GENERAL", "GENERAL"
    PACKING = "PACKING", "PACKING"

  id = models.BigAutoField(primary_key=True)

  move_type = models.CharField(max_length=20, choices=MoveType.choices)
  area = models.IntegerField()  # 평수

  origin_address = models.TextField()
  origin_floor = models.IntegerField()
  origin_has_elevator = models.BooleanField(default=False)
  origin_use_ladder = models.BooleanField(default=False)

  dest_address = models.TextField()
  dest_floor = models.IntegerField()
  dest_has_elevator = models.BooleanField(default=False)
  dest_use_ladder = models.BooleanField(default=False)

  distance_km = models.DecimalField(max_digits=7, decimal_places=2)  # 거리(km)
  recommended_ton = models.DecimalField(
    max_digits=4,
    decimal_places=1,
    help_text="추천 적재 톤수 (예: 6.0, 7.5, 10.0)"
  )
  special_item_count = models.IntegerField(default=0)  # 특수짐 개수

  created_at = models.DateTimeField(auto_now_add=True)

  class Meta:
    db_table = "estimate"
    indexes = [
      models.Index(fields=["move_type"]),
      models.Index(fields=["created_at"]),
    ]

  def __str__(self):
    return f"Estimate#{self.id} ({self.move_type})"


class EstimateTruckPlan(models.Model):
  id = models.BigAutoField(primary_key=True)

  estimate = models.ForeignKey(
    "estimates.Estimate",
    on_delete=models.CASCADE,
    related_name="truck_plans",
    db_index=True,
  )

  truck_type = models.CharField(max_length=20)  # 5T / 1T 등
  truck_count = models.IntegerField()

  inner_w_cm = models.DecimalField(max_digits=7, decimal_places=2)
  inner_d_cm = models.DecimalField(max_digits=7, decimal_places=2)
  inner_h_cm = models.DecimalField(max_digits=7, decimal_places=2)

  class Meta:
    db_table = "estimate_truck_plan"
    indexes = [
      models.Index(fields=["estimate"]),
      models.Index(fields=["truck_type"]),
    ]

  def __str__(self):
    return f"TruckPlan#{self.id} est={self.estimate_id} {self.truck_type}x{self.truck_count}"


class EstimateRoom(models.Model):
  id = models.BigAutoField(primary_key=True)

  estimate = models.ForeignKey(
    "estimates.Estimate",
    on_delete=models.CASCADE,
    related_name="rooms",
    db_index=True,
  )

  vision_image = models.ForeignKey(
    "vision.VisionImage",
    on_delete=models.SET_NULL,
    null=True,
    blank=True,
    related_name="estimate_rooms",
    db_index=True,
  )

  room_type = models.CharField(max_length=30, blank=True)  # 응답용 스냅샷
  image_url = models.TextField(blank=True)  # 응답용 스냅샷

  sort_order = models.IntegerField(default=0)
  created_at = models.DateTimeField(auto_now_add=True)

  class Meta:
    db_table = "estimate_room"
    constraints = [
      models.UniqueConstraint(
        fields=["estimate", "sort_order"],
        name="uq_estimate_room_estimate_sort_order",
      ),
    ]
    indexes = [
      models.Index(fields=["estimate"]),
      models.Index(fields=["vision_image"]),
    ]
    ordering = ["sort_order", "id"]

  def __str__(self):
    return f"Room#{self.id} est={self.estimate_id} order={self.sort_order}"


class EstimateItem(models.Model):
  id = models.BigAutoField(primary_key=True)

  estimate_room = models.ForeignKey(
    "estimates.EstimateRoom",
    on_delete=models.CASCADE,
    related_name="items",
    db_index=True,
  )

  item_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)

  furniture = models.ForeignKey(
    "policy.Furniture",
    on_delete=models.SET_NULL,
    null=True,
    blank=True,
    related_name="estimate_items",
    db_index=True,
  )

  w_cm = models.DecimalField(max_digits=7, decimal_places=2)
  d_cm = models.DecimalField(max_digits=7, decimal_places=2)
  h_cm = models.DecimalField(max_digits=7, decimal_places=2)

  padding_cm = models.DecimalField(max_digits=4, decimal_places=1)

  packed_w_cm = models.DecimalField(max_digits=7, decimal_places=2)
  packed_d_cm = models.DecimalField(max_digits=7, decimal_places=2)
  packed_h_cm = models.DecimalField(max_digits=7, decimal_places=2)

  stackable = models.BooleanField(default=False)
  can_stack_on_top = models.BooleanField(default=False)

  allowed_rotations_json = models.JSONField(default=list)  # ["WDH","DWH"]
  needs_disassembly = models.BooleanField(default=False)

  created_at = models.DateTimeField(auto_now_add=True)

  class Meta:
    db_table = "estimate_item"
    indexes = [
      models.Index(fields=["estimate_room"]),
      models.Index(fields=["furniture"]),
      models.Index(fields=["item_id"]),
    ]

  def __str__(self):
    return f"Item#{self.id} room={self.estimate_room_id}"


class EstimatePrice(models.Model):
  id = models.BigAutoField(primary_key=True)

  estimate = models.OneToOneField(
    "estimates.Estimate",
    on_delete=models.CASCADE,
    related_name="price",
  )

  total_amount = models.IntegerField()
  calculated_at = models.DateTimeField()

  class Meta:
    db_table = "estimate_price"

  def __str__(self):
    return f"Price#{self.id} est={self.estimate_id} total={self.total_amount}"


class EstimatePriceSection(models.Model):
  class Key(models.TextChoices):
    BASE = "BASE", "BASE"
    LADDER = "LADDER", "LADDER"
    STAIRS = "STAIRS", "STAIRS"
    DISTANCE = "DISTANCE", "DISTANCE"
    SPECIAL = "SPECIAL", "SPECIAL"

  id = models.BigAutoField(primary_key=True)

  estimate_price = models.ForeignKey(
    "estimates.EstimatePrice",
    on_delete=models.CASCADE,
    related_name="sections",
    db_index=True,
  )

  key = models.CharField(max_length=20, choices=Key.choices, db_index=True)
  title = models.CharField(max_length=50)
  amount = models.IntegerField()
  description = models.CharField(max_length=255, null=True, blank=True)

  class Meta:
    db_table = "estimate_price_section"
    indexes = [
      models.Index(fields=["estimate_price"]),
      models.Index(fields=["key"]),
    ]

  def __str__(self):
    return f"Section#{self.id} {self.key} {self.amount}"


class EstimatePriceLine(models.Model):
  class Scope(models.TextChoices):
    ORIGIN = "ORIGIN", "ORIGIN"
    DEST = "DEST", "DEST"

  id = models.BigAutoField(primary_key=True)

  estimate_price_section = models.ForeignKey(
    "estimates.EstimatePriceSection",
    on_delete=models.CASCADE,
    related_name="lines",
    db_index=True,
  )

  scope = models.CharField(max_length=10, choices=Scope.choices, null=True, blank=True)

  furniture = models.ForeignKey(
    "policy.Furniture",
    on_delete=models.SET_NULL,
    null=True,
    blank=True,
    related_name="estimate_price_lines",
    db_index=True,
  )

  name_kr = models.CharField(max_length=64, null=True, blank=True)
  amount = models.IntegerField()
  description = models.CharField(max_length=255, null=True, blank=True)

  class Meta:
    db_table = "estimate_price_line"
    indexes = [
      models.Index(fields=["estimate_price_section"]),
      models.Index(fields=["scope"]),
      models.Index(fields=["furniture"]),
    ]

  def __str__(self):
    return f"Line#{self.id} amount={self.amount}"
