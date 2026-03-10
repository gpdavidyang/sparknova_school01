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

export async function sendPasswordResetEmail({
  to,
  resetUrl,
}: {
  to: string;
  resetUrl: string;
}) {
  // 개발 환경에서는 콘솔 출력
  if (!process.env.SENDGRID_API_KEY) {
    console.log(`\n[비밀번호 재설정 링크 (개발용)]\n→ ${resetUrl}\n`);
    return;
  }

  await transporter.sendMail({
    from: `"SparkNova School" <${process.env.EMAIL_FROM}>`,
    to,
    subject: "[SparkNova School] 비밀번호 재설정 안내",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
        <h2 style="font-size: 20px; font-weight: 700; margin-bottom: 8px;">비밀번호 재설정</h2>
        <p style="color: #4E525C; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
          아래 버튼을 클릭하면 비밀번호를 재설정할 수 있습니다.<br/>
          링크는 <strong>1시간</strong> 후 만료됩니다.
        </p>
        <a
          href="${resetUrl}"
          style="display: inline-block; background: #3182F6; color: #fff; padding: 14px 28px; border-radius: 12px; font-size: 15px; font-weight: 600; text-decoration: none;"
        >
          비밀번호 재설정
        </a>
        <p style="color: #8B95A1; font-size: 13px; margin-top: 24px;">
          이 요청을 하지 않으셨다면 이 이메일을 무시해 주세요.
        </p>
      </div>
    `,
  });
}
