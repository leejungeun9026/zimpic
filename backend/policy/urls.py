from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import FurnitureViewSet

router = DefaultRouter()
router.register(r"furniture", FurnitureViewSet, basename="furniture")

urlpatterns = [
  path("", include(router.urls)),
]
