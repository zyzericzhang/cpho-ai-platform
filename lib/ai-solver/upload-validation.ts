import { AI_SOLVER_LIMITS } from "./config";
import type { MaterialRole, UploadedMaterialKind } from "./types";

const imageMimeTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export type UploadFileInput = {
  name: string;
  type: string;
  size: number;
};

export type ValidatedUploadFile = UploadFileInput & {
  kind: UploadedMaterialKind;
  extension: string;
};

export function parseMaterialRole(value: FormDataEntryValue | null): MaterialRole {
  if (value === "problem" || value === "answer" || value === "combined") {
    return value;
  }

  throw new Error("Material role must be problem, answer, or combined.");
}

export function validateUploadBatch(files: UploadFileInput[]): ValidatedUploadFile[] {
  if (files.length === 0) {
    throw new Error("Upload at least one material file.");
  }

  const validated = files.map(validateSingleFile);
  const imageCount = validated.filter((file) => file.kind === "image").length;
  const pdfCount = validated.filter((file) => file.kind === "pdf").length;
  const docxCount = validated.filter((file) => file.kind === "docx").length;
  const kinds = new Set(validated.map((file) => file.kind));

  if (kinds.size > 1) {
    throw new Error("Upload one material shape at a time: images, one PDF, or one DOCX.");
  }

  if (imageCount > AI_SOLVER_LIMITS.maxImageCount) {
    throw new Error("Image uploads support 1 to 10 files.");
  }

  if (pdfCount > 1) {
    throw new Error("PDF uploads support exactly one file.");
  }

  if (docxCount > 1) {
    throw new Error("DOCX uploads support exactly one file.");
  }

  return validated;
}

function validateSingleFile(file: UploadFileInput): ValidatedUploadFile {
  const extension = getExtension(file.name);

  if (extension === "doc") {
    throw new Error("Old .doc files are not supported. Upload .docx instead.");
  }

  if (imageMimeTypes.has(file.type) && ["jpg", "jpeg", "png", "webp", "gif"].includes(extension)) {
    if (file.size > AI_SOLVER_LIMITS.maxImageSizeBytes) {
      throw new Error("Each image must be 10 MB or smaller.");
    }

    return toValidatedFile(file, "image", extension);
  }

  if (file.type === "application/pdf" && extension === "pdf") {
    if (file.size > AI_SOLVER_LIMITS.maxPdfSizeBytes) {
      throw new Error("PDF files must be 25 MB or smaller.");
    }

    return toValidatedFile(file, "pdf", extension);
  }

  if (
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" &&
    extension === "docx"
  ) {
    if (file.size > AI_SOLVER_LIMITS.maxDocxSizeBytes) {
      throw new Error("DOCX files must be 15 MB or smaller.");
    }

    return toValidatedFile(file, "docx", extension);
  }

  throw new Error("Unsupported file type. Use images, PDF, or DOCX.");
}

function getExtension(fileName: string) {
  const parts = fileName.toLowerCase().split(".");
  return parts.length > 1 ? parts.at(-1) ?? "" : "";
}

function toValidatedFile(
  file: UploadFileInput,
  kind: UploadedMaterialKind,
  extension: string,
): ValidatedUploadFile {
  return {
    name: file.name,
    type: file.type,
    size: file.size,
    kind,
    extension,
  };
}
