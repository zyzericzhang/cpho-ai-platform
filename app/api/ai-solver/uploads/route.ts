import { NextRequest, NextResponse } from "next/server";
import { addUploadedMaterial, getStorageBucket } from "@/lib/ai-solver/local-store";
import { getRequestUserId } from "@/lib/ai-solver/request-auth";
import { parseMaterialRole, validateUploadBatch } from "@/lib/ai-solver/upload-validation";

export async function POST(request: NextRequest) {
  try {
    const userId = await getRequestUserId();
    const formData = await request.formData();
    const sessionId = String(formData.get("sessionId") ?? "");
    const role = parseMaterialRole(formData.get("role"));
    const files = formData.getAll("files").filter((entry): entry is File => entry instanceof File);

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId is required." }, { status: 400 });
    }

    const validated = validateUploadBatch(files);
    const uploads = validated.map((file) =>
      addUploadedMaterial({
        sessionId,
        userId,
        role,
        kind: file.kind,
        fileName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
      }),
    );

    return NextResponse.json({
      uploads,
      bucket: getStorageBucket(),
      extraction: {
        status: "not_connected",
        message: "Text extraction is not connected yet. Confirm or edit fields manually.",
      },
    });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 400 });
  }
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unable to validate uploaded materials.";
}
