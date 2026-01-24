from django.urls import path
from .views import EstimateCreateAPIView

urlpatterns = [
  path("estimates/", EstimateCreateAPIView.as_view()),
]
