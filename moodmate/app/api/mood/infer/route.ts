// app/api/mood/infer/route.ts
import * as tf from "@tensorflow/tfjs";
import fs from "fs";
import path from "path";

let model: tf.LayersModel | null = null;

async function loadModel() {
  if (!model) {
    const modelPath = path.join(process.cwd(), "ml-model", "model.json");
    model = await tf.loadLayersModel(`file://${modelPath}`);
  }
  return model;
}

export async function POST(req: Request): Promise<Response> {
  try {
    const { text } = await req.json();
    const model = await loadModel();

    // TODO: convert text → numbers (tokenizer/embedding)
    const inputTensor = tf.tensor([/* encoded text */]);

    const prediction = model.predict(inputTensor) as tf.Tensor;
    const moodIdx = prediction.argMax(-1).dataSync()[0];

    const moods = ["happy", "sad", "calm", "stressed", "angry", "tired"];
    return Response.json({ mood: moods[moodIdx] });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
