import React, { useState } from "react";
import axios from "axios";
import "./App.css";
// --- Make sure you have this image in 'src/assets/' ---
import evolutionImage from "./assets/evolution.png";

// --- Configuration for Your Models ---
const availableModels = [
  {
    id: "transfer",
    name: "Transfer Learning",
    description: "A fine-tuned ResNet50 model.",
  },
  {
    id: "ensemble",
    name: "Ensemble Learning",
    description: 'A "committee" of 3 custom CNNs.',
  },
  {
    id: "hybrid",
    name: "Hybrid Ensemble",
    description: "The average of all 4 models.",
  },
];

export default function App() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [predictedAge, setPredictedAge] = useState(null);
  const [actualAge, setActualAge] = useState("");
  const [geminiData, setGeminiData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: upload, 2: predict, 3: compare, 4: tips
  const [dragActive, setDragActive] = useState(false);
  const [selectedModel, setSelectedModel] = useState("transfer");
  const [showModelDropdown, setShowModelDropdown] = useState(false);

  const handleFileSelect = (file) => {
    if (file && file.type.startsWith("image/")) {
      const imageUrl = URL.createObjectURL(file);
      setSelectedImage(imageUrl);
      setImageFile(file);
      setPredictedAge(null);
      setActualAge("");
      setGeminiData(null);
      setStep(2);
    }
  };

  const handleImageUpload = (e) => handleFileSelect(e.target.files[0]);
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleFileSelect(e.dataTransfer.files[0]);
  };

  const handlePredict = async () => {
    if (!imageFile) return;
    setIsLoading(true);
    setPredictedAge(null);
    const formData = new FormData();
    formData.append("image", imageFile);
    formData.append("model_choice", selectedModel);
    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/predict/",
        formData
      );
      setPredictedAge(response.data.predicted_age);
      setStep(3);
    } catch (error) {
      console.error("Prediction failed:", error);
      alert(
        "Prediction failed. Please ensure your Django backend server is running and accessible."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetTips = async () => {
    if (!predictedAge || !actualAge) {
      alert("Please enter your actual age first.");
      return;
    }
    setIsLoading(true);
    setGeminiData(null);

    const GEMINI_API_KEY = "AIzaSyD10TTq8aKL7XDyItK-k802uf1c4xaHGn0";
    const api_url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

    let prompt;
    const pAge = parseFloat(predictedAge);
    const aAge = parseInt(actualAge);

    if (pAge > aAge) {
      prompt = `You are an encouraging and motivational health & skincare coach. A user's AI-predicted age is ${pAge.toFixed(
        1
      )}, which is higher than their actual age of ${aAge}. This is a great opportunity for improvement! Provide actionable tips on how they can enhance their health and potentially "reverse" their biological age to appear younger and fitter. The tone should be positive and empowering, not critical. Return ONLY a valid JSON object following this exact schema: {"summary": "A short, motivating summary about the opportunity to improve.", "healthTips": ["A specific health tip for improvement.", "Another specific health tip.", "A third specific health tip."], "skincareTips": ["A specific skincare tip for a more youthful appearance.", "Another specific skincare tip.", "A third specific skincare tip."], "lifestyleTips": ["A key lifestyle change to feel younger.", "Another key lifestyle change."]}`;
    } else {
      prompt = `You are an encouraging and celebratory health & skincare coach. A user's AI-predicted age is ${pAge.toFixed(
        1
      )}, which is younger than or equal to their actual age of ${aAge}. Congratulations to them on their excellent health and appearance! Provide useful tips on how they can maintain their fitness and youthful vitality. The tone should be positive and reinforcing. Return ONLY a valid JSON object following this exact schema: {"summary": "A short, congratulatory summary on looking young and fit.", "healthTips": ["A specific health tip for maintenance.", "Another specific health tip.", "A third specific health tip."], "skincareTips": ["A specific skincare tip to maintain skin health.", "Another specific skincare tip.", "A third specific skincare tip."], "lifestyleTips": ["A key lifestyle tip for continued well-being.", "Another key lifestyle tip."]}`;
    }

    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" },
    };

    try {
      const response = await axios.post(api_url, payload);
      const jsonText = response.data.candidates[0].content.parts[0].text;
      setGeminiData(JSON.parse(jsonText));
      setStep(4);
    } catch (error) {
      console.error("Get tips failed:", error);
      alert(
        "Failed to get tips from the Gemini API. Please check your API key and the console."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const resetApp = () => {
    setSelectedImage(null);
    setImageFile(null);
    setPredictedAge(null);
    setActualAge("");
    setGeminiData(null);
    setStep(1);
  };

  const getCurrentModel = () =>
    availableModels.find((model) => model.id === selectedModel);
  const getAgeDifference = () => Math.abs(predictedAge - parseInt(actualAge));
  const getAgeStatus = () => {
    if (!predictedAge || !actualAge) return null;
    const pAge = parseFloat(predictedAge);
    const aAge = parseInt(actualAge);
    if (pAge <= aAge) return { status: "Excellent!", color: "#28a745" };
    const diff = getAgeDifference();
    if (diff <= 10) return { status: "Good", color: "#8bc34a" };
    return { status: "Needs Attention", color: "#f59e0b" };
  };

  return (
    <div className="app-container">
      <div
        className="background-image left-half"
        style={{ backgroundImage: `url(${evolutionImage})` }}
      ></div>
      <div
        className="background-image right-half"
        style={{ backgroundImage: `url(${evolutionImage})` }}
      ></div>

      <header className="app-header-stable">
        <div className="header-content">
          <div className="logo-section">
            <div className="logo-text">Smart Health Insights</div>
            <div className="logo-subtitle">using Age Prediction AI</div>
          </div>
          <div
            className="model-selector"
            onMouseLeave={() => setShowModelDropdown(false)}
          >
            <div
              className="model-dropdown"
              onMouseEnter={() => setShowModelDropdown(true)}
            >
              <div className="selected-model">
                <span className="model-name">{getCurrentModel()?.name}</span>
                <span className="dropdown-arrow">▼</span>
              </div>
              {showModelDropdown && (
                <div className="model-options">
                  <div className="options-header">Choose your model</div>
                  {availableModels.map((model) => (
                    <div
                      key={model.id}
                      className={`model-option ${
                        selectedModel === model.id ? "selected" : ""
                      }`}
                      onClick={() => {
                        setSelectedModel(model.id);
                        setShowModelDropdown(false);
                      }}
                    >
                      <div className="model-info">
                        <span className="model-name">{model.name}</span>
                        <span className="model-description">
                          {model.description}
                        </span>
                      </div>
                      {selectedModel === model.id && (
                        <span className="checkmark">✔</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      <div className="progress-bar">
        <div
          className={`progress-step ${step >= 1 ? "active" : ""} ${
            step > 1 ? "completed" : ""
          }`}
        >
          <div className="step-number">1</div>
          <span>Upload</span>
        </div>
        <div
          className={`progress-step ${step >= 2 ? "active" : ""} ${
            step > 2 ? "completed" : ""
          }`}
        >
          <div className="step-number">2</div>
          <span>Predict</span>
        </div>
        <div
          className={`progress-step ${step >= 3 ? "active" : ""} ${
            step > 3 ? "completed" : ""
          }`}
        >
          <div className="step-number">3</div>
          <span>Compare</span>
        </div>
        <div className={`progress-step ${step >= 4 ? "active" : ""}`}>
          <div className="step-number">4</div>
          <span>Get Tips</span>
        </div>
      </div>

      <div className="main-card">
        {step === 1 && (
          <div className="upload-section">
            <h2>Upload Your Photo</h2>
            <p>Drag & drop a clear photo of a face to begin.</p>
            <div
              className={`upload-area ${dragActive ? "drag-active" : ""}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="upload-content">
                <div className="upload-icon">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                    />
                  </svg>
                </div>
                <p>Drag & drop your photo here</p>
                <p className="upload-or">or</p>
                <label htmlFor="file-upload" className="upload-button">
                  Choose File
                </label>
                <input
                  id="file-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="file-input"
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="prediction-section">
            <h2>Ready to Predict</h2>
            <div className="model-info-display">
              <p>
                Model Selected: <strong>{getCurrentModel()?.name}</strong>
              </p>
            </div>
            <div className="image-preview">
              <img src={selectedImage} alt="Preview" />
            </div>
            <div className="prediction-actions">
              <button onClick={() => setStep(1)} className="change-photo-btn">
                Change Photo
              </button>
              <button
                onClick={handlePredict}
                className="predict-btn"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="loading-spinner">
                    <div className="spinner"></div>
                    <span>Analyzing...</span>
                  </div>
                ) : (
                  `Predict Age`
                )}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="results-section">
            <h2>Prediction vs. Reality</h2>
            <div className="age-comparison">
              <div className="age-card predicted">
                <div className="age-label">Body Age</div>
                <div className="age-value">{predictedAge?.toFixed(1)}</div>
              </div>
              <div className="comparison-arrow">↔️</div>
              <div className="age-card actual">
                <div className="age-label">Biological Age</div>
                <input
                  type="number"
                  placeholder="Enter Age"
                  value={actualAge}
                  onChange={(e) => setActualAge(e.target.value)}
                  className="age-input"
                />
              </div>
            </div>
            {actualAge && predictedAge && (
              <div className="age-analysis">
                <div className="analysis-card">
                  <span
                    className="analysis-status"
                    style={{ color: getAgeStatus()?.color }}
                  >
                    {getAgeStatus()?.status}: Difference of {getAgeDifference()}{" "}
                    years
                  </span>
                </div>
              </div>
            )}
            <div className="action-buttons">
              <button onClick={() => setStep(2)} className="btn-secondary">
                Re-Predict
              </button>
              {/* --- UI FIX: Using the same className as the Predict button --- */}
              <button
                onClick={handleGetTips}
                className="predict-btn"
                disabled={!actualAge || isLoading}
              >
                {isLoading ? (
                  <div className="loading-spinner">
                    <div className="spinner"></div>
                    <span>Getting Tips...</span>
                  </div>
                ) : (
                  "Get Personalized Tips"
                )}
              </button>
            </div>
          </div>
        )}

        {step === 4 && geminiData && (
          <div className="tips-section">
            <h2>Personalized Health Insights</h2>
            <div className="summary-card">
              <h3>{geminiData.summary}</h3>
            </div>
            <div className="tips-grid">
              <div className="tip-category">
                <div className="tip-header health">
                  <h4>Health Tips</h4>
                </div>
                <ul>
                  {geminiData.healthTips.map((tip, i) => (
                    <li key={i}>{tip}</li>
                  ))}
                </ul>
              </div>
              <div className="tip-category">
                <div className="tip-header skincare">
                  <h4>Skincare Tips</h4>
                </div>
                <ul>
                  {geminiData.skincareTips.map((tip, i) => (
                    <li key={i}>{tip}</li>
                  ))}
                </ul>
              </div>
              <div className="tip-category">
                <div className="tip-header lifestyle">
                  <h4>Lifestyle Tips</h4>
                </div>
                <ul>
                  {geminiData.lifestyleTips.map((tip, i) => (
                    <li key={i}>{tip}</li>
                  ))}
                </ul>
              </div>
            </div>
            {/* --- UI FIX: Using the same className as the Predict button --- */}
            <center>
              <button onClick={resetApp} className="predict-btn">
                Start Over
              </button>
            </center>
          </div>
        )}
      </div>
    </div>
  );
}
