export const runtime = "nodejs"; // run on edge runtime

import * as tf from "@tensorflow/tfjs";

let model: tf.LayersModel | null = null;

async function loadModel() {
  if (!model) {
    // Use environment variable, fallback to local public folder
    const baseUrl = process.env.NEXT_PUBLIC_MODEL_BASE_URL || "";
    const modelUrl = `${baseUrl}/ml-model/model.json`;

    model = await tf.loadLayersModel(modelUrl);
    console.log("✅ Model loaded from:", modelUrl);
  }
  return model;
}

// Simple character-level encoding
function encodeText(text: string): number[] {
  return text
    .toLowerCase()
    .split("")
    .map((ch) => ch.charCodeAt(0) % 100);
}

export async function POST(req: Request): Promise<Response> {
  try {
    const { text } = await req.json();
    if (!text || typeof text !== "string") {
      return new Response(JSON.stringify({ error: "Invalid input" }), {
        status: 400,
      });
    }

    const model = await loadModel();

    // Encode & pad sequence
    const encoded = encodeText(text);
    const MAX_LEN = 100; // must match training preprocessing
    const padded = new Array(MAX_LEN).fill(0);
    for (let i = 0; i < Math.min(encoded.length, MAX_LEN); i++) {
      padded[i] = encoded[i];
    }

    const inputTensor = tf.tensor2d([padded], [1, MAX_LEN]);

    // Run prediction
    const prediction = model.predict(inputTensor) as tf.Tensor;
    const predictionData = Array.from(await prediction.data());
    const moodIdx = predictionData.indexOf(Math.max(...predictionData));

    // Clean up tensor to avoid memory leak
    tf.dispose([inputTensor, prediction]);

    const moods = ["Positive", "Neutral", "Negative", "Irrelevant"];
    const mood = moods[moodIdx] ?? "unknown";

    return Response.json({ mood, scores: predictionData });
  } catch (err: any) {
    console.error("❌ Error in inference:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}
