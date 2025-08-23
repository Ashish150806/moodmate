import os
import joblib
from flask import Flask, request, jsonify
from flask_cors import CORS
import traceback

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend requests

# Base directory (where main.py is located)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Load saved vectorizer + model (cross-platform safe path)
vectorizer = joblib.load(os.path.join(BASE_DIR, "models", "tfidf_vectorizer.pkl"))
model = joblib.load(os.path.join(BASE_DIR, "models", "sentiment_model.pkl"))

@app.route("/", methods=["GET"])
def home():
    return "Sentiment Analysis API is running!"

@app.route("/favicon.ico")
def favicon():
    return "", 204

@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json(force=True)
        print("Incoming JSON:", data)  # Debug log

        text = data.get("text", "")

        if not text.strip():
            return jsonify({"error": "Empty text input"}), 400

        # Transform using trained vectorizer
        X = vectorizer.transform([text])
        prediction = model.predict(X)[0]

        print("Prediction:", prediction)  # Debug log
        return jsonify({"sentiment": str(prediction)})

    except Exception as e:
        print("Error:", traceback.format_exc())  # Debug log
        return jsonify({"error": str(e)}), 500

if _name_ == "_main_":
    # Required for Render deployment
    app.run(host="0.0.0.0", port=5000, debug=True)
