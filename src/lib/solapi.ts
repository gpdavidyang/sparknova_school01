/**
 * 솔라피(Solapi) 카카오 알림톡 유틸리티
 * https://developers.solapi.com/
 *
 * API Key 설정 후 활성화:
 *   SOLAPI_API_KEY=your_key
 *   SOLAPI_API_SECRET=your_secret
 *   SOLAPI_SENDER_ID=발신번호(카카오채널)
 */

const SOLAPI_API_URL = "https://api.solapi.com/messages/v4/send";

function buildHmacHeader(apiKey: string, apiSecret: string) {
  const date = new Date().toISOString();
  const salt = Math.random().toString(36).slice(2, 12);
  const data = `${date}${salt}`;

  // Node.js 환경에서 HMAC-SHA256 생성
  const { createHmac } = require("crypto") as typeof import("crypto");
  const signature = createHmac("sha256", apiSecret).update(data).digest("hex");

  return `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`;
}

interface KakaoMessage {
  to: string;       // 수신자 전화번호 (010-xxxx-xxxx)
  templateId: string;
  variables: Record<string, string>;
}

export async function sendKakaoAlimtalk(message: KakaoMessage): Promise<boolean> {
  const apiKey = process.env.SOLAPI_API_KEY;
  const apiSecret = process.env.SOLAPI_API_SECRET;
  const from = process.env.SOLAPI_SENDER_ID;

  // API Key 미설정 시 개발 환경에서 로그만 출력
  if (!apiKey || !apiSecret || !from) {
    if (process.env.NODE_ENV === "development") {
      console.log("[Solapi] 알림톡 (API Key 미설정 — 로컬 시뮬레이션):", message);
    }
    return false;
  }

  try {
    const res = await fetch(SOLAPI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: buildHmacHeader(apiKey, apiSecret),
      },
      body: JSON.stringify({
        message: {
          to: message.to.replace(/-/g, ""),
          from,
          kakaoOptions: {
            pfId: from,
            templateId: message.templateId,
            variables: message.variables,
          },
        },
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      console.error("[Solapi] 알림톡 발송 실패:", err);
      return false;
    }

    return true;
  } catch (e) {
    console.error("[Solapi] 알림톡 오류:", e);
    return false;
  }
}

// ──────────────────────────────────────────────
// 알림 템플릿 모음
// (실제 카카오 채널 템플릿 ID로 교체 필요)
// ──────────────────────────────────────────────

/** 결제 완료 알림 */
export async function notifyPaymentSuccess({
  phone,
  userName,
  orderName,
  amount,
}: {
  phone: string;
  userName: string;
  orderName: string;
  amount: number;
}) {
  return sendKakaoAlimtalk({
    to: phone,
    templateId: "KA01TP_PAYMENT_SUCCESS", // 실제 템플릿 ID로 교체
    variables: {
      "#{이름}": userName,
      "#{상품명}": orderName,
      "#{금액}": `${amount.toLocaleString()}원`,
    },
  });
}

/** 레벨업 알림 */
export async function notifyLevelUp({
  phone,
  userName,
  level,
  levelName,
}: {
  phone: string;
  userName: string;
  level: number;
  levelName: string;
}) {
  return sendKakaoAlimtalk({
    to: phone,
    templateId: "KA01TP_LEVEL_UP",
    variables: {
      "#{이름}": userName,
      "#{레벨}": String(level),
      "#{레벨명}": levelName,
    },
  });
}

/** 회원가입 환영 알림 */
export async function notifyWelcome({
  phone,
  userName,
}: {
  phone: string;
  userName: string;
}) {
  return sendKakaoAlimtalk({
    to: phone,
    templateId: "KA01TP_WELCOME",
    variables: {
      "#{이름}": userName,
    },
  });
}

/** 수료증 발급 알림 */
export async function notifyCertificateIssued({
  phone,
  userName,
  courseTitle,
}: {
  phone: string;
  userName: string;
  courseTitle: string;
}) {
  return sendKakaoAlimtalk({
    to: phone,
    templateId: "KA01TP_CERTIFICATE",
    variables: {
      "#{이름}": userName,
      "#{강좌명}": courseTitle,
    },
  });
}

/** 이벤트 리마인더 알림 */
export async function notifyEventReminder({
  phone,
  userName,
  eventTitle,
  startAt,
}: {
  phone: string;
  userName: string;
  eventTitle: string;
  startAt: string;
}) {
  return sendKakaoAlimtalk({
    to: phone,
    templateId: "KA01TP_EVENT_REMINDER",
    variables: {
      "#{이름}": userName,
      "#{이벤트명}": eventTitle,
      "#{시작시간}": startAt,
    },
  });
}
