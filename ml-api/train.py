import pandas as pd
import pickle
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.svm import LinearSVC
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import os

# 1. Load dataset
df = pd.read_csv("data/twitter_training.csv")

# 🔎 Check column names
print("Columns in dataset:", df.columns)

# 2. Select correct columns (adjust based on dataset)
# For Kaggle twitter_training.csv → "text" is in 3rd column, "sentiment" in 2nd
if "text" in df.columns and "sentiment" in df.columns:
    X = df["text"]
    y = df["sentiment"]
else:
    # fallback for datasets without headers
    df = pd.read_csv("data/twitter_training.csv", header=None)
    # usually: 0=id, 1=entity, 2=sentiment, 3=text
    df = df.dropna()
    X = df[3]   # tweet text
    y = df[2]   # sentiment label

print("Sample data:\n", df.head())

# 3. Train-test split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# 4. Create pipeline (TF-IDF + LinearSVC)
model = Pipeline([
    ("tfidf", TfidfVectorizer(stop_words="english", max_features=5000)),
    ("clf", LinearSVC())
])

# 5. Train model
model.fit(X_train, y_train)

# 6. Evaluate
y_pred = model.predict(X_test)
print("✅ Accuracy:", accuracy_score(y_test, y_pred))

# 7. Save model
os.makedirs("models", exist_ok=True)
with open("models/sentiment_model.pkl", "wb") as f:
    pickle.dump(model, f)

print("🎉 Model trained and saved at models/sentiment_model.pkl")
