import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PaymentNotificationRequest {
  email: string;
  type: "verified" | "rejected";
  tokenPackage?: number;
  amount?: number;
  transactionId?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, type, tokenPackage, amount, transactionId }: PaymentNotificationRequest = await req.json();

    console.log(`Sending ${type} notification to ${email}`);

    let subject: string;
    let html: string;

    if (type === "verified") {
      subject = "✅ Payment Verified - Tokens Added!";
      html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0f; color: #ffffff; padding: 40px 20px;">
          <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(145deg, #1a1a2e, #16213e); border-radius: 16px; padding: 40px; border: 1px solid rgba(157, 78, 221, 0.3);">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="font-size: 48px; margin-bottom: 20px;">🎉</div>
              <h1 style="color: #9d4edd; margin: 0; font-size: 28px;">Payment Verified!</h1>
            </div>
            
            <p style="color: #e0e0e0; font-size: 16px; line-height: 1.6;">
              Great news! Your payment has been verified and your tokens have been added to your account.
            </p>
            
            <div style="background: rgba(157, 78, 221, 0.1); border-radius: 12px; padding: 20px; margin: 24px 0; border: 1px solid rgba(157, 78, 221, 0.2);">
              <h3 style="color: #9d4edd; margin: 0 0 16px 0; font-size: 18px;">Transaction Details</h3>
              <table style="width: 100%; color: #e0e0e0;">
                ${transactionId ? `<tr><td style="padding: 8px 0; color: #a0a0a0;">Transaction ID:</td><td style="padding: 8px 0; text-align: right; font-family: monospace;">${transactionId}</td></tr>` : ''}
                ${amount ? `<tr><td style="padding: 8px 0; color: #a0a0a0;">Amount:</td><td style="padding: 8px 0; text-align: right; font-weight: bold;">₹${amount}</td></tr>` : ''}
                <tr><td style="padding: 8px 0; color: #a0a0a0;">Tokens Added:</td><td style="padding: 8px 0; text-align: right; font-weight: bold; color: #00d26a;">+${tokenPackage || 0}</td></tr>
              </table>
            </div>
            
            <p style="color: #e0e0e0; font-size: 16px; line-height: 1.6;">
              You can now use these tokens to generate AI-powered ID cards. Start creating amazing designs today!
            </p>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="https://ai-id-card-generator.lovable.app" style="display: inline-block; background: linear-gradient(135deg, #9d4edd, #7b2cbf); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                Start Creating
              </a>
            </div>
            
            <p style="color: #666; font-size: 12px; text-align: center; margin-top: 30px;">
              Thank you for using AI ID Card Generator!
            </p>
          </div>
        </body>
        </html>
      `;
    } else {
      subject = "❌ Payment Rejected - Action Required";
      html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0f; color: #ffffff; padding: 40px 20px;">
          <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(145deg, #1a1a2e, #16213e); border-radius: 16px; padding: 40px; border: 1px solid rgba(239, 68, 68, 0.3);">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="font-size: 48px; margin-bottom: 20px;">❌</div>
              <h1 style="color: #ef4444; margin: 0; font-size: 28px;">Payment Rejected</h1>
            </div>
            
            <p style="color: #e0e0e0; font-size: 16px; line-height: 1.6;">
              We're sorry, but we couldn't verify your payment. This could be due to one of the following reasons:
            </p>
            
            <ul style="color: #e0e0e0; font-size: 14px; line-height: 1.8; padding-left: 20px;">
              <li>Invalid or incorrect transaction ID</li>
              <li>Payment amount doesn't match the selected package</li>
              <li>Transaction not found in our records</li>
              <li>Duplicate transaction ID</li>
            </ul>
            
            ${transactionId ? `
            <div style="background: rgba(239, 68, 68, 0.1); border-radius: 12px; padding: 20px; margin: 24px 0; border: 1px solid rgba(239, 68, 68, 0.2);">
              <p style="margin: 0; color: #a0a0a0;">Submitted Transaction ID:</p>
              <p style="margin: 8px 0 0 0; font-family: monospace; color: #e0e0e0;">${transactionId}</p>
            </div>
            ` : ''}
            
            <p style="color: #e0e0e0; font-size: 16px; line-height: 1.6;">
              If you believe this is an error, please contact our support team with your payment proof and we'll be happy to help resolve this issue.
            </p>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="mailto:support@ai-id-card-generator.com" style="display: inline-block; background: rgba(239, 68, 68, 0.2); color: #ef4444; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; border: 1px solid rgba(239, 68, 68, 0.3);">
                Contact Support
              </a>
            </div>
            
            <p style="color: #666; font-size: 12px; text-align: center; margin-top: 30px;">
              We apologize for any inconvenience caused.
            </p>
          </div>
        </body>
        </html>
      `;
    }

    const emailResponse = await resend.emails.send({
      from: "AI ID Card Generator <onboarding@resend.dev>",
      to: [email],
      subject,
      html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, ...emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending notification:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
