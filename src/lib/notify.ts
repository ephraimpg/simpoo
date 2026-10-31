/**
 * Optional outbound notifications for new enquiries.
 *
 * The site ALWAYS persists enquiries to data/enquiries.json (visible in the
 * admin dashboard), so nothing is lost when no email provider is configured.
 *
 * Two optional channels (both purely env-driven, no SDKs required):
 *   1. FORM_WEBHOOK_URL — any endpoint (Make/Zapier/CRM) that accepts JSON.
 *   2. RESEND_API_KEY + RESEND_FROM + RESEND_TO — transactional email via Resend's REST API.
 */

interface NotifyPayload {
  type: string;
  guardianName: string;
  phone: string;
  email: string | null;
  gradeOfInterest: string | null;
  message: string;
  receivedAt: string;
}

async function postJson(url: string, body: unknown, headers: Record<string, string>, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", ...headers },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export async function notifyNewEnquiry(payload: NotifyPayload): Promise<void> {
  const tasks: Promise<boolean>[] = [];

  const webhook = process.env.FORM_WEBHOOK_URL;
  if (webhook) tasks.push(postJson(webhook, payload, {}));

  const resendKey = process.env.RESEND_API_KEY;
  const resendFrom = process.env.RESEND_FROM;
  const resendTo = process.env.RESEND_TO;
  if (resendKey && resendFrom && resendTo) {
    tasks.push(
      postJson(
        "https://api.resend.com/emails",
        {
          from: resendFrom,
          to: [resendTo],
          reply_to: payload.email ?? undefined,
          subject: `New ${payload.type} enquiry from ${payload.guardianName}`,
          text: [
            `Name: ${payload.guardianName}`,
            `Phone: ${payload.phone}`,
            `Email: ${payload.email ?? "not provided"}`,
            `Grade of interest: ${payload.gradeOfInterest ?? "not specified"}`,
            `Received: ${payload.receivedAt}`,
            "",
            "Message:",
            payload.message,
          ].join("\n"),
        },
        { authorization: `Bearer ${resendKey}` },
      ),
    );
  }

  if (tasks.length === 0) return;
  const results = await Promise.allSettled(tasks);
  const failed = results.some((r) => r.status === "rejected" || r.value === false);
  if (failed) {
    console.warn("[enquiries] Notification delivery failed; the enquiry is still saved in the dashboard.");
  }
}
