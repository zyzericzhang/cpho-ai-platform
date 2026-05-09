import type { ValidatedUploadFile } from "./upload-validation";

export async function toProviderImageDataUrl(file: File, validated: ValidatedUploadFile) {
  if (validated.kind !== "image") {
    return undefined;
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  return `data:${validated.type};base64,${buffer.toString("base64")}`;
}
