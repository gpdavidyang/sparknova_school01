import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? "smtp.sendgrid.net",
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER ?? "apikey",
    pass: process.env.SENDGRID_API_KEY ?? "",
  },
});

const isDev = !process.env.SENDGRID_API_KEY;

async function sendMail(options: { to: string; subject: string; html: string }) {
  if (isDev) {
    console.log(`\n[이메일 (개발용)] To: ${options.to}\nSubject: ${options.subject}\n`);
    return;
  }
  await transporter.sendMail({
    from: `"SparkNova School" <${process.env.EMAIL_FROM}>`,
    ...options,
  });
}

const BASE_STYLE = `font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;`;
const BTN_STYLE = `display: inline-block; background: #3182F6; color: #fff; padding: 14px 28px; border-radius: 12px; font-size: 15px; font-weight: 600; text-decoration: none;`;
const MUTED = `color: #8B95A1; font-size: 13px; margin-top: 24px;`;

export async function sendPasswordResetEmail({ to, resetUrl }: { to: string; resetUrl: string }) {
  if (isDev) {
    console.log(`\n[비밀번호 재설정 링크 (개발용)]\n→ ${resetUrl}\n`);
    return;
  }
  await sendMail({
    to,
    subject: "[SparkNova School] 비밀번호 재설정 안내",
    html: `
      <div style="${BASE_STYLE}">
        <h2 style="font-size: 20px; font-weight: 700; margin-bottom: 8px;">비밀번호 재설정</h2>
        <p style="color: #4E525C; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
          아래 버튼을 클릭하면 비밀번호를 재설정할 수 있습니다.<br/>
          링크는 <strong>1시간</strong> 후 만료됩니다.
        </p>
        <a href="${resetUrl}" style="${BTN_STYLE}">비밀번호 재설정</a>
        <p style="${MUTED}">이 요청을 하지 않으셨다면 이 이메일을 무시해 주세요.</p>
      </div>
    `,
  });
}

export async function sendWelcomeEmail({ to, name }: { to: string; name: string }) {
  await sendMail({
    to,
    subject: "[SparkNova School] 가입을 환영합니다!",
    html: `
      <div style="${BASE_STYLE}">
        <h2 style="font-size: 20px; font-weight: 700; margin-bottom: 8px;">환영합니다, ${name}님!</h2>
        <p style="color: #4E525C; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
          SparkNova School에 가입해주셔서 감사합니다.<br/>
          다양한 커뮤니티와 강의를 탐색해보세요.
        </p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/explore" style="${BTN_STYLE}">커뮤니티 둘러보기</a>
        <p style="${MUTED}">궁금한 점이 있으시면 언제든지 문의해 주세요.</p>
      </div>
    `,
  });
}

export async function sendPaymentReceiptEmail({
  to,
  name,
  orderName,
  amount,
  paidAt,
}: {
  to: string;
  name: string;
  orderName: string;
  amount: number;
  paidAt: Date;
}) {
  const formatted = new Intl.DateTimeFormat("ko-KR", {
    year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(paidAt);

  await sendMail({
    to,
    subject: `[SparkNova School] 결제가 완료되었습니다 — ${orderName}`,
    html: `
      <div style="${BASE_STYLE}">
        <h2 style="font-size: 20px; font-weight: 700; margin-bottom: 8px;">결제 완료</h2>
        <p style="color: #4E525C; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
          ${name}님, 결제가 정상적으로 완료되었습니다.
        </p>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 24px;">
          <tr><td style="padding: 8px 0; color: #8B95A1; width: 110px;">상품명</td><td style="padding: 8px 0; font-weight: 600;">${orderName}</td></tr>
          <tr><td style="padding: 8px 0; color: #8B95A1;">결제 금액</td><td style="padding: 8px 0; font-weight: 700; color: #3182F6;">${amount.toLocaleString()}원</td></tr>
          <tr><td style="padding: 8px 0; color: #8B95A1;">결제 일시</td><td style="padding: 8px 0;">${formatted}</td></tr>
        </table>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/my/payments" style="${BTN_STYLE}">결제 내역 보기</a>
        <p style="${MUTED}">결제 관련 문의는 고객센터로 연락해 주세요.</p>
      </div>
    `,
  });
}

export async function sendSubscriptionExpiryEmail({
  to,
  name,
  communityName,
  expiresAt,
  renewUrl,
}: {
  to: string;
  name: string;
  communityName: string;
  expiresAt: Date;
  renewUrl: string;
}) {
  const formatted = new Intl.DateTimeFormat("ko-KR", {
    year: "numeric", month: "long", day: "numeric",
  }).format(expiresAt);

  await sendMail({
    to,
    subject: `[SparkNova School] "${communityName}" 멤버십이 3일 후 만료됩니다`,
    html: `
      <div style="${BASE_STYLE}">
        <h2 style="font-size: 20px; font-weight: 700; margin-bottom: 8px;">멤버십 만료 예정 안내</h2>
        <p style="color: #4E525C; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
          ${name}님, <strong>${communityName}</strong> 커뮤니티 멤버십이<br/>
          <strong>${formatted}</strong>에 만료될 예정입니다.
        </p>
        <p style="color: #4E525C; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
          멤버십이 만료되면 강좌 수강 및 커뮤니티 활동이 제한될 수 있습니다.<br/>
          지금 갱신하여 끊김 없이 이용하세요.
        </p>
        <a href="${renewUrl}" style="${BTN_STYLE}">멤버십 갱신하기</a>
        <p style="${MUTED}">이 이메일은 회원님의 멤버십 관리를 위해 발송되었습니다.</p>
      </div>
    `,
  });
}

export async function sendCommentNotificationEmail({
  to,
  commenterName,
  postTitle,
  commentBody,
  postUrl,
}: {
  to: string;
  commenterName: string;
  postTitle: string;
  commentBody: string;
  postUrl: string;
}) {
  await sendMail({
    to,
    subject: `[SparkNova School] "${commenterName}"님이 댓글을 달았습니다`,
    html: `
      <div style="${BASE_STYLE}">
        <h2 style="font-size: 20px; font-weight: 700; margin-bottom: 8px;">새 댓글 알림</h2>
        <p style="color: #4E525C; font-size: 15px; line-height: 1.6; margin-bottom: 16px;">
          <strong>${commenterName}</strong>님이 회원님의 게시글에 댓글을 남겼습니다.
        </p>
        <div style="background: #F8F9FA; border-left: 3px solid #3182F6; padding: 12px 16px; border-radius: 4px; margin-bottom: 24px;">
          <p style="font-size: 13px; color: #8B95A1; margin: 0 0 4px;">${postTitle}</p>
          <p style="font-size: 14px; color: #1A1A2E; margin: 0;">${commentBody}</p>
        </div>
        <a href="${postUrl}" style="${BTN_STYLE}">게시글 보기</a>
        <p style="${MUTED}">알림 수신을 원하지 않으시면 설정에서 변경하세요.</p>
      </div>
    `,
  });
}
