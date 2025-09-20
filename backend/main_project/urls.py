from django.urls import path, include

urlpatterns = [
    # Forward all requests to our 'predictor' app's URLs
    path('', include('predictor.urls')),
]
