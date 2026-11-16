import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const emailFrom = process.env.EMAIL_FROM || "Task Manager <onboarding@resend.dev>";
const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// Lazy initialize or create client safely
export const resend = resendApiKey ? new Resend(resendApiKey) : null;

/**
 * Sends an email verification link to a registered user.
 */
export async function sendVerificationEmail(to: string, token: string) {
  try {
    if (!resend) {
      console.warn("[EMAIL] RESEND_API_KEY is not configured. Email not sent.");
      return { success: false, error: "Email service not configured" };
    }

    const verifyUrl = `${appUrl}/verify-email?token=${token}`;

    const { data, error } = await resend.emails.send({
      from: emailFrom,
      to,
      subject: "Verify your email address - Task Manager",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #1e293b; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <div style="margin-bottom: 24px; text-align: center;">
            <h1 style="color: #0f172a; font-size: 24px; font-weight: 700; margin: 0;">Task Manager</h1>
          </div>
          
          <h2 style="color: #0f172a; font-size: 18px; margin-top: 0; font-weight: 600;">Verify your email address</h2>
          
          <p style="font-size: 15px; line-height: 1.6; color: #334155; margin-bottom: 24px;">
            Thank you for registering! Please click the button below to verify your email address and activate your account.
          </p>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="${verifyUrl}" style="background-color: #4f46e5; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          
          <p style="font-size: 13px; line-height: 1.6; color: #64748b; margin-top: 24px;">
            If the button doesn't work, copy and paste this link into your browser:
            <br />
            <a href="${verifyUrl}" style="color: #4f46e5; word-break: break-all;">${verifyUrl}</a>
          </p>
          
          <p style="font-size: 13px; color: #94a3b8; margin-top: 16px;">
            This link will expire in 24 hours.
          </p>
          
          <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center;">
            If you did not sign up for Task Manager, you can safely ignore this email.
          </div>
        </div>
      `,
    });

    if (error) {
      console.error("[EMAIL] Resend verification error:", error);
      return { success: false, error };
    }

    console.log(`[EMAIL] Verification email sent to ${to}. ID: ${data?.id}`);
    return { success: true, data };
  } catch (err) {
    console.error("[EMAIL] Unexpected error while sending verification email:", err);
    return { success: false, error: err };
  }
}

/**
 * Sends a welcome email to the newly registered user.
 * Wrapped in safe error handling so any email delivery failure will NOT crash or roll back user registration.
 */
export async function sendWelcomeEmail(to: string) {
  try {
    if (!resend) {
      console.warn("[EMAIL] RESEND_API_KEY is not configured. Email not sent.");
      return { success: false, error: "Email service not configured" };
    }

    const { data, error } = await resend.emails.send({
      from: emailFrom,
      to,
      subject: "Welcome to Task Manager!",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #1e293b; background-color: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0;">
          <h2 style="color: #0f172a; margin-top: 0;">Welcome to Task Manager! 🚀</h2>
          <p style="font-size: 15px; line-height: 1.6; color: #334155;">
            Thank you for registering. Your account has been successfully created.
          </p>
          <p style="font-size: 15px; line-height: 1.6; color: #334155;">
            You can now organize your projects, manage tasks with priorities, and track your daily productivity seamlessly.
          </p>
          <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #94a3b8;">
            If you did not create this account, you can safely ignore this email.
          </div>
        </div>
      `,
    });

    if (error) {
      console.error("[EMAIL] Resend API error:", error);
      return { success: false, error };
    }

    console.log(`[EMAIL] Welcome email successfully sent to ${to}. ID: ${data?.id}`);
    return { success: true, data };
  } catch (err) {
    console.error("[EMAIL] Unexpected error while sending welcome email:", err);
    return { success: false, error: err };
  }
}
