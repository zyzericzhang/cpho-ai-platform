import type { AiSolverAnalysisInput, AiSolverImageContext, AiSolverProviderMaterialContext } from "./types";

export type OpenAiCompatibleTextPart = {
  type: "text";
  text: string;
};

export type OpenAiCompatibleImagePart = {
  type: "image_url";
  image_url: {
    url: string;
  };
};

export type OpenAiCompatibleFilePart = {
  type: "file";
  file: {
    filename: string;
    file_data: string;
  };
};

export type OpenAiCompatibleContentPart =
  | OpenAiCompatibleTextPart
  | OpenAiCompatibleImagePart
  | OpenAiCompatibleFilePart;

export type OpenAiCompatibleMessage = {
  role: "system" | "user" | "assistant";
  content: string | OpenAiCompatibleContentPart[];
};

export function buildAiSolverUserContent(input: AiSolverAnalysisInput): OpenAiCompatibleContentPart[] {
  const content: OpenAiCompatibleContentPart[] = [
    {
      type: "text",
      text: [
        "Analyze this physics olympiad problem from the uploaded multimodal materials.",
        "Treat files labeled problem as the problem statement, files labeled answer as the standard answer, and files labeled combined as both.",
        "The answer material is the source of truth for the no-standard-answer gate.",
        "Read PDFs/images directly; do not require manually transcribed text.",
        "",
        "<problem_text>",
        input.problemText.trim(),
        "</problem_text>",
        "",
        "<diagram_notes>",
        input.diagramNotes.trim() || "No diagram notes were provided.",
        "</diagram_notes>",
        "",
        "<standard_answer>",
        input.standardAnswer.trim(),
        "</standard_answer>",
      ].join("\n"),
    },
  ];

  for (const material of input.materials ?? []) {
    content.push({
      type: "text",
      text: [
        `<uploaded_material role="${material.role}" kind="${material.kind}">`,
        `filename=${material.fileName}`,
        `mime_type=${material.mimeType}`,
        "</uploaded_material>",
      ].join("\n"),
    });

    const filePart = toFilePart(material);
    if (filePart) {
      content.push(filePart);
      continue;
    }

    const imagePart = toMaterialImagePart(material);
    if (imagePart) {
      content.push(imagePart);
    }
  }

  for (const image of input.images ?? []) {
    const imageUrl = toImageUrl(image);

    if (imageUrl) {
      content.push({
        type: "image_url",
        image_url: {
          url: imageUrl,
        },
      });
    }
  }

  return content;
}

export function getDroppedImageWarnings(images: AiSolverImageContext[] | undefined) {
  if (!images?.length) return [];

  const dropped = images.filter((image) => !toImageUrl(image)).length;
  return dropped > 0
    ? [`${dropped} image context item(s) were omitted because they did not contain a valid image data URL or URL.`]
    : [];
}

export function getDroppedMaterialWarnings(materials: AiSolverProviderMaterialContext[] | undefined) {
  if (!materials?.length) return [];

  const dropped = materials.filter((material) => !toFilePart(material) && !toMaterialImagePart(material)).length;
  return dropped > 0
    ? [`${dropped} uploaded material item(s) were omitted because they are not provider-supported PDF/image data URLs.`]
    : [];
}

function toImageUrl(image: AiSolverImageContext) {
  if (!image.mimeType.startsWith("image/")) {
    return null;
  }

  if (image.url?.startsWith("https://") || image.url?.startsWith("data:image/")) {
    return image.url;
  }

  if (image.data) {
    const encoded = image.data.startsWith("data:image/") ? image.data : `data:${image.mimeType};base64,${image.data}`;
    return encoded;
  }

  return null;
}

function toFilePart(material: AiSolverProviderMaterialContext): OpenAiCompatibleFilePart | null {
  if (material.kind !== "pdf" || material.mimeType !== "application/pdf") {
    return null;
  }

  if (!material.dataUrl.startsWith("data:application/pdf;base64,")) {
    return null;
  }

  return {
    type: "file",
    file: {
      filename: material.fileName,
      file_data: material.dataUrl,
    },
  };
}

function toMaterialImagePart(material: AiSolverProviderMaterialContext): OpenAiCompatibleImagePart | null {
  if (material.kind !== "image" || !material.mimeType.startsWith("image/")) {
    return null;
  }

  if (!material.dataUrl.startsWith(`data:${material.mimeType};base64,`)) {
    return null;
  }

  return {
    type: "image_url",
    image_url: {
      url: material.dataUrl,
    },
  };
}
