from rest_framework import serializers
from .models import Furniture


class FurnitureSerializer(serializers.ModelSerializer):
  class Meta:
    model = Furniture
    exclude = ("yolo_id", "padding_cm", "stackable", "can_stack_on_top")
