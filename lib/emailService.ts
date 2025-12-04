import nodemailer from "nodemailer";

// Check if email configuration is available
const isEmailConfigured = () => {
  return !!(process.env.SMTP_USER && process.env.SMTP_PASS);
};

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendVerificationEmail(email: string, token: string) {
  // Check if email is configured
  if (!isEmailConfigured()) {
    console.error("Email not configured! Please set SMTP_USER and SMTP_PASS in .env.local");
    console.error("Verification URL for manual testing:", `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/verify-email/${token}`);
    throw new Error("Email service is not configured. Please set up SMTP credentials in .env.local");
  }

  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/verify-email/${token}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">Welcome to FastLink!</h1>
      </div>
      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          Thank you for registering with FastLink. Please verify your email address by clicking the button below:
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="display: inline-block; padding: 14px 28px; background-color: #667eea; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">
            Verify Email Address
          </a>
        </div>
        <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
          Or copy and paste this link in your browser:
        </p>
        <p style="color: #667eea; font-size: 14px; word-break: break-all;">
          ${verificationUrl}
        </p>
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          This link will expire in 24 hours. If you didn't create an account, please ignore this email.
        </p>
      </div>
    </div>
  `;

  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_USER || "noreply@fastlink.com",
      to: email,
      subject: "Verify Your FastLink Email Address",
      html,
    });
    console.log("Verification email sent successfully:", info.messageId);
    return true;
  } catch (error: any) {
    console.error("Email sending error:", error);
    console.error("Error details:", {
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode,
    });
    throw error; // Re-throw so calling code knows it failed
  }
}

export async function sendApplicationNotification(
  email: string,
  jobTitle: string,
  businessName: string
) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">Application Status Update</h1>
      </div>
      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          Your application for <strong>${jobTitle}</strong> at <strong>${businessName}</strong> has been reviewed.
        </p>
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          Please log in to your FastLink account to view the status and any updates.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/login" style="display: inline-block; padding: 14px 28px; background-color: #667eea; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">
            View Application
          </a>
        </div>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: process.env.SMTP_USER || "noreply@fastlink.com",
      to: email,
      subject: `Application Update: ${jobTitle}`,
      html,
    });
    return true;
  } catch (error) {
    console.error("Email sending error:", error);
    return false;
  }
}

type NewApplicationEmailPayload = {
  to: string;
  businessName: string;
  jobTitle: string;
  applicantName: string;
  promotionTier: "free" | "pro";
};

export async function sendNewApplicationEmail({
  to,
  businessName,
  jobTitle,
  applicantName,
  promotionTier,
}: NewApplicationEmailPayload) {
  if (!isEmailConfigured()) {
    console.warn("Skipping application notification email: SMTP not configured.");
    return false;
  }

  const tierMessage =
    promotionTier === "pro"
      ? "Your Pro Featured listing just received a new applicant. Their application includes priority visibility to job seekers."
      : "Your listing just received a new applicant. Log in to review their details right away.";

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #facc15 0%, #f97316 100%); padding: 26px; text-align: center; border-radius: 14px 14px 0 0;">
        <h1 style="color: #111827; margin: 0; font-size: 24px;">New applicant for ${jobTitle}</h1>
      </div>
      <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 14px 14px;">
        <p style="color: #111827; font-size: 15px; line-height: 1.6;">
          Hi ${businessName},
        </p>
        <p style="color: #111827; font-size: 15px; line-height: 1.6;">
          <strong>${applicantName}</strong> just applied for <strong>${jobTitle}</strong>.
        </p>
        <p style="color: #374151; font-size: 14px; line-height: 1.6;">${tierMessage}</p>
        <div style="text-align: center; margin: 28px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/business/jobs" style="display: inline-block; padding: 12px 28px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600;">
            Review Applications
          </a>
        </div>
        <p style="color: #6b7280; font-size: 13px;">
          Keep the momentum going — respond quickly to stand out with candidates.
        </p>
        <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">
          You are receiving this notification because you have job application alerts enabled on FastLink.
        </p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: process.env.SMTP_USER || "noreply@fastlink.com",
      to,
      subject: `New applicant for ${jobTitle}`,
      html,
    });
    return true;
  } catch (error) {
    console.error("Email sending error:", error);
    return false;
  }
}

