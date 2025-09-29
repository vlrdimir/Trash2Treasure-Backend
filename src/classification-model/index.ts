import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-cpu"; // atau "@tensorflow/tfjs-backend-wasm"
import jpeg from "jpeg-js";

interface PredictionResult {
  label: string;
  probs: number[];
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

function decodeJpegToTensor(imageBuffer: Buffer): tf.Tensor<tf.Rank.R3> {
  const { width, height, data } = jpeg.decode(imageBuffer, { useTArray: true }); // RGBA
  const numPixels: number = width * height;
  const rgb = new Uint8Array(numPixels * 3);
  for (let i = 0, j = 0; i < numPixels; i++, j += 4) {
    rgb[i * 3 + 0] = data[j + 0]!; // R
    rgb[i * 3 + 1] = data[j + 1]!; // G
    rgb[i * 3 + 2] = data[j + 2]!; // B
  }
  // int32 lalu toFloat() → skala 0..255 (sama seperti tf.node.decodeJpeg)
  return tf.tensor3d(rgb, [height, width, 3], "int32").toFloat();
}

async function predictClassification(
  model: tf.GraphModel,
  imageBuffer: Buffer
): Promise<PredictionResult> {
  const img: tf.Tensor<tf.Rank.R3> = decodeJpegToTensor(imageBuffer); // [H,W,3], float32 0..255
  const resized: tf.Tensor<tf.Rank.R4> = tf.image.resizeNearestNeighbor(
    img.expandDims(0) as tf.Tensor4D,
    [224, 224]
  ); // [1,224,224,3]
  const pred = model.predict(resized) as tf.Tensor; // [1,12]
  const probs = (await pred.data()) as Float32Array; // Float32Array
  const idx: number = probs.indexOf(Math.max(...probs));
  return { label: labels[idx]!, probs: Array.from(probs) };
}

async function main(imageBuffer: Buffer) {
  const model: tf.GraphModel = await tf.loadGraphModel(
    "https://cp.dontdemoit.com/model/model.json"
  );
  console.log("Model loaded successfully.");

  console.log("Image loaded.");

  const result: PredictionResult = await predictClassification(
    model,
    imageBuffer
  );
  console.log("Final Prediction:", result);

  return result;
}

export default main;
