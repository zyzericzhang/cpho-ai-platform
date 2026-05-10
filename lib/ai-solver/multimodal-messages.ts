import type { AiSolverAnalysisInput, AiSolverImageContext } from "./types";

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

export type OpenAiCompatibleContentPart = OpenAiCompatibleTextPart | OpenAiCompatibleImagePart;

export type OpenAiCompatibleMessage = {
  role: "system" | "user" | "assistant";
  content: string | OpenAiCompatibleContentPart[];
};

export function buildAiSolverUserContent(input: AiSolverAnalysisInput): OpenAiCompatibleContentPart[] {
  const content: OpenAiCompatibleContentPart[] = [
    {
      type: "text",
      text: [
        "Analyze this physics olympiad problem using the confirmed standard answer.",
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
