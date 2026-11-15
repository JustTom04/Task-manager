import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const emailFrom = process.env.EMAIL_FROM || "Task Manager <onboarding@resend.dev>";

// Lazy initialize or create client safely
export const resend = resendApiKey ? new Resend(resendApiKey) : null;

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
