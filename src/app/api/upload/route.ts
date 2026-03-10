import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { uploadFile, StorageBucket } from "@/lib/storage";
import { nanoid } from "nanoid";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

const BUCKET_MAP: Record<string, StorageBucket> = {
  avatar: "avatars",
  cover: "covers",
  thumbnail: "thumbnails",
};

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const type = (formData.get("type") as string) ?? "avatar";

  if (!file) return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 });
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "JPG, PNG, WebP, GIF만 업로드 가능합니다." }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "파일 크기는 5MB 이하여야 합니다." }, { status: 400 });
  }

  const bucket = BUCKET_MAP[type] ?? "avatars";
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${session.user.id}/${nanoid()}.${ext}`;

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const url = await uploadFile({ bucket, path, file: buffer, contentType: file.type });
    return NextResponse.json({ url });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[Upload] 실패:", msg);
    return NextResponse.json({ error: `업로드 실패: ${msg}` }, { status: 500 });
  }
}
