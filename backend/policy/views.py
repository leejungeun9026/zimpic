from rest_framework import viewsets
from rest_framework.permissions import AllowAny

from .models import Furniture
from .serializers import FurnitureSerializer

class FurnitureViewSet(viewsets.ReadOnlyModelViewSet) :
  """
  GET /api/policy/furniture/      전체리스트
  GET /api/policy/furniture/{id}  단건
  """
  queryset = Furniture.objects.exclude(category="ETC").order_by("id")
  serializer_class = FurnitureSerializer
  permission_classes = [AllowAny]

  pagination_class = None