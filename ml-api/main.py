import pickle
from fastapi import FastAPI
from pydantic import BaseModel

# Load saved model
with open("models/sentiment_model.pkl", "rb") as f:
    model = pickle.load(f)

app = FastAPI()

class TextIn(BaseModel):
    text: str

@app.post("/predict")
def predict_mood(data: TextIn):
    prediction = model.predict([data.text])[0]
    return {"mood": prediction}
