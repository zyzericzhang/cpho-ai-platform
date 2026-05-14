import { NextRequest, NextResponse } from "next/server";
import { toProviderMaterialDataUrl } from "@/lib/ai-solver/image-context";
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
    const uploads = await Promise.all(
      validated.map(async (validatedFile, index) => {
        const file = files[index];
        const providerDataUrl = await toProviderMaterialDataUrl(file, validatedFile);

        return addUploadedMaterial({
          sessionId,
          userId,
          role,
          kind: validatedFile.kind,
          fileName: validatedFile.name,
          mimeType: validatedFile.type,
          sizeBytes: validatedFile.size,
          providerDataUrl,
        });
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
