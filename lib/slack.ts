/**
 * Post summary to Slack via Incoming Webhook.
 * Set SLACK_WEBHOOK_URL in .env to enable.
 */

export async function postToSlack(text: string): Promise<{ ok: boolean; error?: string }> {
  const url = process.env.SLACK_WEBHOOK_URL;
  if (!url?.startsWith("https://hooks.slack.com/")) {
    return { ok: false, error: "Slack webhook not configured (SLACK_WEBHOOK_URL)" };
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        unfurl_links: false,
        unfurl_media: false,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      return { ok: false, error: `Slack API: ${res.status} ${body.slice(0, 200)}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}
