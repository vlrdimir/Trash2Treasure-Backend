import { Client } from "@gradio/client";
import fs from "fs";

interface GradioResponse {
  path: string;
  url: string;
  size: null;
  orig_name: string;
  mime_type: null;
  is_stream: boolean;
  meta: {
    _type: string;
  };
}

interface GradioResult {
  type: string;
  time: string;
  data: any[][];
  endpoint: string;
  fn_index: number;
}

export default async function removeBg(imageBuffer: Buffer) {
  const client = await Client.connect("not-lain/background-removal");
  const result = (await client.predict("/image", {
    image: imageBuffer,
  })) as unknown as GradioResult;

  const resp = result.data[0]![1] as unknown as GradioResponse;

  const url = await fetch(resp.url);
  const buffer = await url.arrayBuffer();
  return Buffer.from(buffer);
}
