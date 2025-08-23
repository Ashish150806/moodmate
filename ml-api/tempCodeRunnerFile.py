import joblib
from flask import Flask, request, jsonify
from flask_cors import CORS
import traceback

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend requests

# Load saved vectorizer + model (ensure these files are in the same directory as app.py)
vectorizer = joblib.load(r"models\tfidf_vectorizer.pkl")
model = joblib.load(r"models\sentiment_model.pkl")

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

if __name__ == "__main__":
    app.run(debug=True)
