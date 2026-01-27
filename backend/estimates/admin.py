from django.contrib import admin
from .models import (
  Estimate,
  EstimateTruckPlan,
  EstimateRoom,
  EstimateItem,
  EstimatePrice,
  EstimatePriceSection,
  EstimatePriceLine,
)

class ReadOnlyAdmin(admin.ModelAdmin):
  def has_add_permission(self, request):
    return False

  def has_change_permission(self, request, obj=None):
    return False

  def has_delete_permission(self, request, obj=None):
    return False



@admin.register(Estimate)
class EstimateAdmin(ReadOnlyAdmin):
  list_display = (
    "id",
    "move_type",
    "area",
    "recommended_ton",
    "total_cbm",
    "truck_capacity_cbm",
    "load_factor_pct",
    "remaining_cbm",
    "distance_km",
    "created_at",
  )
  list_filter = ("move_type", "created_at")
  search_fields = ("origin_address", "dest_address")


@admin.register(EstimateTruckPlan)
class EstimateTruckPlanAdmin(ReadOnlyAdmin):
  list_display = (
    "id",
    "estimate",
    "truck_type",
    "truck_count",
    "capacity_cbm",
    "load_cbm",
    "load_factor_pct",
    "remaining_cbm",
    "inner_w_cm",
    "inner_d_cm",
    "inner_h_cm",
  )
  list_filter = ("truck_type",)
  search_fields = ("estimate__id",)
  readonly_fields = (
    "capacity_cbm",
    "load_cbm",
    "load_factor_pct",
    "remaining_cbm",
  )


@admin.register(EstimateRoom)
class EstimateRoomAdmin(ReadOnlyAdmin):
  list_display = ("id", "estimate_id", "vision_image_id", "room_type", "sort_order", "created_at")
  list_filter = ("room_type",)
  raw_id_fields = ("estimate", "vision_image")
  ordering = ("estimate_id", "sort_order")


@admin.register(EstimateItem)
class EstimateItemAdmin(ReadOnlyAdmin):
  list_display = ("id", "estimate_room_id", "item_id", "furniture_id", "w_cm", "d_cm", "h_cm", "needs_disassembly", "created_at")
  raw_id_fields = ("estimate_room", "furniture")
  search_fields = ("item_id",)


@admin.register(EstimatePrice)
class EstimatePriceAdmin(ReadOnlyAdmin):
  list_display = ("id", "estimate_id", "total_amount", "calculated_at")
  raw_id_fields = ("estimate",)


@admin.register(EstimatePriceSection)
class EstimatePriceSectionAdmin(ReadOnlyAdmin):
  list_display = ("id", "estimate_price_id", "key", "title", "amount")
  list_filter = ("key",)
  raw_id_fields = ("estimate_price",)


@admin.register(EstimatePriceLine)
class EstimatePriceLineAdmin(ReadOnlyAdmin):
  list_display = ("id", "estimate_price_section_id", "scope", "furniture_id", "name_kr", "amount")
  list_filter = ("scope",)
  raw_id_fields = ("estimate_price_section", "furniture")
