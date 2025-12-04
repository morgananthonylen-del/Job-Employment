import { supabaseAdmin } from "@/lib/supabaseAdmin";

type RegisterDocumentParams = {
  applicationId: string;
  resumeUrl: string | null | undefined;
  documentType?: string | null;
};

const PUBLIC_PATH_REGEX = /\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/;

export function parseStorageLocation(publicUrl: string) {
  if (!publicUrl) return null;
  try {
    const url = new URL(publicUrl);
    const match = url.pathname.match(PUBLIC_PATH_REGEX);
    if (!match) return null;
    return {
      bucket: match[1],
      path: decodeURIComponent(match[2]),
    };
  } catch (error) {
    console.error("Failed to parse storage location:", error);
    return null;
  }
}

export async function registerApplicationDocument({
  applicationId,
  resumeUrl,
  documentType,
}: RegisterDocumentParams) {
  if (!resumeUrl || !applicationId) {
    return null;
  }

  const location = parseStorageLocation(resumeUrl);
  if (!location) {
    console.warn("Unable to derive storage location from resume URL", resumeUrl);
    return null;
  }

  const payload = {
    application_id: applicationId,
    storage_bucket: location.bucket,
    storage_path: location.path,
    document_type: documentType || null,
    status: "pending",
  };

  const { data, error } = await supabaseAdmin
    .from("application_documents")
    .upsert(payload, {
      onConflict: "application_id,storage_bucket,storage_path",
      ignoreDuplicates: false,
    })
    .select()
    .maybeSingle();

  if (error) {
    console.error("Failed to register application document:", error);
    throw error;
  }

  return data;
}






