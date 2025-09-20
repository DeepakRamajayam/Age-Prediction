🧑‍💻 Age Prediction AI Project

An AI-powered web application that predicts a person’s age from an uploaded image using deep learning models.

https://github.com/user-attachments/assets/82045d9d-6a3e-4f8b-96f3-f5c1014b33b3

-----------------------------------------------------------------------------------------------------------------------------------------------------------------

# Project Workflow\

1. 🖼️ User Uploads Image
* The user uploads an image through the React frontend.

2. 📡 Frontend Sends Request
* The React app sends the uploaded image to the Django backend API.

3. 🧠 Backend Receives & Processes
* The Django backend receives the image and selects the appropriate model from the Models/ directory.

4. 🤖 Model Prediction
* A pre-trained ML model (Keras / ONNX) is used to predict the age from the image.

5. 📬 Response Sent
* The predicted age is sent back from the backend to the frontend.

6. 🎉 Result Displayed
* The frontend displays the predicted age to the user.

  ---------------------------------------------------------------------------------------------------------------------------------------------------------------------

# 🛠️ Tech Stack

* Frontend: React
* Backend: Django
* ML Models: Keras, ONNX
* Languages: Python, JavaScript
* 
-------------------------------------------------------------------------------------------------------------------------------------------------------------------

🎯 Future Enhancements

* Suggest Online Products based on skin Types.
* Deploy on cloud platforms (AWS/GCP/Azure).
* Add support for mobile app integration.

--------------------------------------------------------------------------------------------------------------------------------------------------------------------

->  Setup Frontend (React)

* cd frontend
* npm install
* npm start

2. Setup Backend (Django)
* cd backend
* .\venv\Scripts\Activate.ps1
* python manage.py runserver


---------------------------------------------------------------------------------------------------------------------------------------------------------------------















Languages: Python, JavaScript
