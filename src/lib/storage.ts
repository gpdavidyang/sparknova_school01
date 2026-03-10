import { createClient } from "@supabase/supabase-js";

// 서버 사이드 전용 (서비스 롤 키 사용)
function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  // 서비스 키가 없으면 anon 키 사용 (개발 환경)
  return createClient(url, serviceKey ?? anonKey);
}

export type StorageBucket = "avatars" | "covers" | "thumbnails" | "digital-products";

/**
 * 파일을 Supabase Storage에 업로드하고 공개 URL 반환
 */
export async function uploadFile({
  bucket,
  path,
  file,
  contentType,
}: {
  bucket: StorageBucket;
  path: string;
  file: Buffer | Blob;
  contentType: string;
}): Promise<string> {
  const supabase = getAdminClient();

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { contentType, upsert: true });

  if (error) throw new Error(`Storage upload failed: ${error.message}`);

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * 파일 삭제
 */
export async function deleteFile(bucket: StorageBucket, path: string) {
  const supabase = getAdminClient();
  await supabase.storage.from(bucket).remove([path]);
}
