import "@tensorflow/tfjs-backend-cpu"; // atau "@tensorflow/tfjs-backend-wasm"
import sharp from "sharp";
import removeBg from "./remove-bg";
import { Client } from "@gradio/client";

interface PredictionResult {
  label: string;
  percentage: number;
  probabilities: Record<string, number>;
}

// classes
export const labels: string[] = [
  "battery",
  "biological",
  "brown-glass",
  "cardboard",
  "clothes",
  "green-glass",
  "metal",
  "paper",
  "plastic",
  "shoes",
  "trash",
  "white-glass",
];

async function ensureJpegBuffer(imageBuffer: Buffer): Promise<Buffer> {
  if (sharp) {
    try {
      return await sharp(imageBuffer).jpeg().toBuffer();
    } catch (err) {
      throw new Error(`Image conversion failed: ${(err as Error).message}`);
    }
  }
  return imageBuffer;
}

async function predictClassification(imageBuffer: Buffer): Promise<{
  result: PredictionResult[];
  urlRemoveBg: string;
}> {
  const removedBg = await removeBg(imageBuffer);
  const jpegBuffer = await ensureJpegBuffer(removedBg.buffer);

  if (
    jpegBuffer.length < 2 ||
    jpegBuffer[0] !== 0xff ||
    jpegBuffer[1] !== 0xd8
  ) {
    throw new Error("Invalid image: JPEG SOI not found");
  }

  const client = await Client.connect("g4tes/classification-garbage");
  const result = await client.predict("/predict", [jpegBuffer]);

  return {
    result: result.data as PredictionResult[],
    urlRemoveBg: removedBg.url,
  };
}

async function main(imageBuffer: Buffer): Promise<{
  result: PredictionResult[];
  urlRemoveBg: string;
}> {
  console.log("Model loaded successfully.");

  console.log("Image loaded.");

  const result = await predictClassification(imageBuffer);

  console.log("Final Prediction:", result.result);

  return result;
}

export default main;
