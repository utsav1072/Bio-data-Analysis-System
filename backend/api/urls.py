from django.urls import path
from .views import PDFProcessView, PDFDownloadView, HealthCheckView

urlpatterns = [
    path('health/', HealthCheckView.as_view(), name='health-check'),
    path('process/', PDFProcessView.as_view(), name='pdf-process'),
    path('download/<str:filename>/', PDFDownloadView.as_view(), name='pdf-download'),
]
