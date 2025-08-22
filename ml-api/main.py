from fastapi import FastAPI
from pydantic import BaseModel
import pickle

app = FastAPI()

# Load model + vectorizer
with open("models/sentiment_model.pkl", "rb") as f:
    model = pickle.load(f)
with open("models/tfidf_vectorizer.pkl", "rb") as f:
    vectorizer = pickle.load(f)

class InputText(BaseModel):
    text: str

@app.post("/infer")
def infer(input: InputText):
    X = vectorizer.transform([input.text])
    pred = model.predict(X)[0]
    return {"mood": str(pred)}
