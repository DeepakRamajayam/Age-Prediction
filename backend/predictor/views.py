# predictor/views.py
import os
import numpy as np
import tensorflow as tf
import onnxruntime as ort
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from PIL import Image
import io
from django.conf import settings

IMG_SIZE = 224

print("--- Initializing AI Models ---")

MODELS_DIR = os.path.join(settings.BASE_DIR, 'Models')

try:
    keras_model_1 = tf.keras.models.load_model(os.path.join(MODELS_DIR, "keras_cnn_model_1.keras"))
    keras_model_2 = tf.keras.models.load_model(os.path.join(MODELS_DIR, "keras_cnn_model_2.keras"))
    keras_model_3 = tf.keras.models.load_model(os.path.join(MODELS_DIR, "keras_cnn_model_3.keras"))
    ensemble_models = [keras_model_1, keras_model_2, keras_model_3]
    print("✅ Ensemble models (.keras) loaded successfully.")

    onnx_path = os.path.join(MODELS_DIR, "resnet50_finetuned.onnx")
    onnx_session = ort.InferenceSession(onnx_path)
    print("✅ Transfer Learning model (.onnx) loaded successfully.")

except Exception as e:
    print(f"❌ CRITICAL ERROR: Could not load models. Ensure files are in the 'backend/Models' directory. Error: {e}")
    ensemble_models = []
    onnx_session = None

def preprocess_for_keras(image_bytes):
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB").resize((IMG_SIZE, IMG_SIZE))
    image_array = np.array(image) / 255.0
    return np.expand_dims(image_array, axis=0)

def preprocess_for_onnx(image_bytes):
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB").resize((IMG_SIZE, IMG_SIZE))
    image_array = np.array(image, dtype=np.float32).transpose(2, 0, 1)
    mean = np.array([0.485, 0.456, 0.406], dtype=np.float32).reshape(3, 1, 1)
    std = np.array([0.229, 0.224, 0.225], dtype=np.float32).reshape(3, 1, 1)
    normalized_array = (image_array / 255 - mean) / std
    return np.expand_dims(normalized_array, axis=0).astype(np.float32)

def index(request):
    return JsonResponse({"status": "Django backend is running!"})

@csrf_exempt
def predict(request):
    if request.method != "POST":
        return JsonResponse({"error": "Invalid request method"}, status=405)
    
    if 'image' not in request.FILES or 'model_choice' not in request.POST:
        return JsonResponse({"error": "Missing 'image' or 'model_choice'"}, status=400)

    try:
        image_file = request.FILES['image']
        model_choice = request.POST['model_choice']
        image_bytes = image_file.read()

        predictions = []

        if model_choice in ['transfer', 'hybrid']:
            if not onnx_session: raise RuntimeError("ONNX model is not loaded.")
            onnx_input = preprocess_for_onnx(image_bytes)
            input_name = onnx_session.get_inputs()[0].name
            result = onnx_session.run(None, {input_name: onnx_input})
            predictions.append(result[0][0][0])

        if model_choice in ['ensemble', 'hybrid']:
            if not ensemble_models: raise RuntimeError("Keras models are not loaded.")
            keras_input = preprocess_for_keras(image_bytes)
            for model in ensemble_models:
                pred = model.predict(keras_input, verbose=0)
                predictions.append(pred[0][0])
        
        if not predictions:
            return JsonResponse({"error": f"Invalid model choice: {model_choice}"}, status=400)

        final_prediction = np.mean(predictions)
        return JsonResponse({"predicted_age": float(final_prediction)})

    except Exception as e:
        print(f"Prediction Error: {e}")
        return JsonResponse({"error": "An internal error occurred during prediction."}, status=500)