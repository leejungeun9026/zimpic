from django.contrib import admin
from .models import Furniture, FurnitureRotation, BoxRule, TruckSpec, BasePrice, LadderFeeRule, StairsFeeRule, DistanceFeeRule, SpecialItemFee


class FurnitureRotationInline(admin.TabularInline):
  model = FurnitureRotation
  extra = 1


@admin.register(Furniture)
class FurnitureAdmin(admin.ModelAdmin):
  list_display = (
    "id",
    "name_kr",
    "name_en",
    "category",
    "yolo_id",
    "needs_disassembly",
    "stackable",
    "can_stack_on_top",
  )

  list_filter = (
    "category",
    "needs_disassembly",
    "stackable",
    "can_stack_on_top",
  )

  search_fields = (
    "name_kr",
    "name_en",
    "reference_model",
  )

  ordering = ("id",)
  readonly_fields = ("id", "yolo_id", "name_en")

  inlines = [FurnitureRotationInline]

  fieldsets = (
    ("기본 정보", {
      "fields": (
        "category",
        "yolo_id",
        "name_en",
        "name_kr",
      )
    }),
    ("부피 기준 (정책값)", {
      "fields": (
        "width_cm",
        "depth_cm",
        "height_cm",
        "padding_cm",
      )
    }),
    ("적재 / 옵션 정책", {
      "fields": (
        "needs_disassembly",
        "stackable",
        "can_stack_on_top",
      )
    }),
    ("참고 정보", {
      "fields": (
        "description",
        "reference_model",
        "reference_url",
      )
    }),
  )



@admin.register(FurnitureRotation)
class FurnitureRotationAdmin(admin.ModelAdmin):
  list_display = (
    "id",
    "furniture",
    "orientation_code",
    "note",
  )

  list_filter = (
    "orientation_code",
  )

  search_fields = (
    "furniture__name_kr",
    "furniture__name_en",
  )

  ordering = ("furniture", "orientation_code")




@admin.register(BoxRule)
class BoxRuleAdmin(admin.ModelAdmin):
  list_display = (
    "id",
    "area_range",
    "boxes_min",
    "boxes_avg",
    "boxes_max",
    "note",
  )

  search_fields = ("note",)
  ordering = ("id",)

  fieldsets = (
    ("평수 구간", {
      "fields": ("area_min_py", "area_max_py"),
    }),
    ("박스 수 기준", {
      "fields": ("boxes_avg", "boxes_min", "boxes_max"),
    }),
    ("상태", {
      "fields": ["note"],
    }),
  )

  def area_range(self, obj):
    return f"{obj.area_min_py} ~ {obj.area_max_py}평"
  area_range.short_description = "평수 구간"



@admin.register(TruckSpec)
class TruckSpecAdmin(admin.ModelAdmin):
  list_display = (
    "id",
    "truck_type",
    "body_type",
    "name",
    "inner_width_cm",
    "inner_length_cm",
    "inner_height_cm",
    "cbm_geom",
    "is_active",
  )
  list_filter = ("body_type", "is_active")
  search_fields = ("truck_type", "name")
  ordering = ("id",)



@admin.register(BasePrice)
class BasePriceAdmin(admin.ModelAdmin):
  list_display = (
    "id",
    "move_type",
    "truck_type",
    "base_amount",
    "included_workers",
    "note",
    "is_active",
    )
  list_filter = ("move_type", "truck_type", "is_active")
  search_fields = ("note",)
  ordering = ("id", )


@admin.register(LadderFeeRule)
class LadderFeeRuleAdmin(admin.ModelAdmin):
  list_display = (
    "id",
    "ladder_truck_group", 
    "floor_from", 
    "floor_to", 
    "base_amount", 
    "is_active"
  )
  list_filter = ("ladder_truck_group", "is_active")
  ordering = ("id",)


@admin.register(StairsFeeRule)
class StairsFeeRuleAdmin(admin.ModelAdmin):
  list_display = (
    "id",
    "floor_from", 
    "floor_to", 
    "per_floor_amount", 
    "is_active"
  )
  list_filter = ("is_active",)
  ordering = ("id", )


@admin.register(DistanceFeeRule)
class DistanceFeeRuleAdmin(admin.ModelAdmin):
  list_display = (
    "id",
    "truck_type", 
    "base_km", 
    "unit_km", 
    "per_unit_amount", 
    "is_active"
  )
  list_filter = ("truck_type", "is_active")
  ordering = ("id", )


@admin.register(SpecialItemFee)
class SpecialItemFeeAdmin(admin.ModelAdmin):
  list_display = (
    "id",
    "furniture__id",
    "furniture__name_en", 
    "description", 
    "unit_amount", 
    "is_active"
  )
  list_filter = ("is_active",)
  search_fields = ("furniture__name_en", "description")
  ordering = ("id",)
