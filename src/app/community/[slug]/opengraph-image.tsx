import { ImageResponse } from "next/og";
import { db } from "@/lib/db";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function OgImage({ params }: Props) {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);

  const community = await db.community.findUnique({
    where: { slug },
    select: {
      name: true,
      description: true,
      avatarUrl: true,
      _count: { select: { members: { where: { isActive: true } }, courses: { where: { isPublished: true } } } },
    },
  });

  const name = community?.name ?? slug;
  const desc = community?.description ?? "SparkNova School 커뮤니티";
  const memberCount = community?._count.members ?? 0;
  const courseCount = community?._count.courses ?? 0;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(135deg, #EFF6FF 0%, #F5F3FF 100%)",
          padding: "60px",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }}
      >
        {/* 로고 */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "auto" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              background: "#3B82F6",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "20px",
              fontWeight: 700,
            }}
          >
            ⚡
          </div>
          <span style={{ fontSize: "18px", fontWeight: 700, color: "#1E40AF" }}>SparkNova School</span>
        </div>

        {/* 메인 콘텐츠 */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div
            style={{
              fontSize: "56px",
              fontWeight: 800,
              color: "#1E293B",
              lineHeight: 1.1,
              letterSpacing: "-1px",
              maxWidth: "900px",
            }}
          >
            {name}
          </div>

          {desc && (
            <div
              style={{
                fontSize: "24px",
                color: "#64748B",
                lineHeight: 1.5,
                maxWidth: "800px",
                overflow: "hidden",
                display: "-webkit-box",
              }}
            >
              {desc.slice(0, 100)}{desc.length > 100 ? "…" : ""}
            </div>
          )}

          {/* 통계 */}
          <div style={{ display: "flex", gap: "24px", marginTop: "16px" }}>
            <div
              style={{
                background: "white",
                borderRadius: "12px",
                padding: "12px 24px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
              }}
            >
              <span style={{ fontSize: "18px" }}>👥</span>
              <span style={{ fontSize: "18px", fontWeight: 700, color: "#3B82F6" }}>
                {memberCount.toLocaleString()}명
              </span>
              <span style={{ fontSize: "16px", color: "#64748B" }}>멤버</span>
            </div>
            {courseCount > 0 && (
              <div
                style={{
                  background: "white",
                  borderRadius: "12px",
                  padding: "12px 24px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                }}
              >
                <span style={{ fontSize: "18px" }}>📚</span>
                <span style={{ fontSize: "18px", fontWeight: 700, color: "#7C3AED" }}>
                  {courseCount}개
                </span>
                <span style={{ fontSize: "16px", color: "#64748B" }}>강좌</span>
              </div>
            )}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
