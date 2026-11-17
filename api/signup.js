/**
 * UnlockIST launch-reminder signup (Vercel Serverless).
 * Forwards the email to Web3Forms using a server-side access key.
 *
 * Vercel env (Project → Settings → Environment Variables):
 *   WEB3FORMS_ACCESS_KEY  — required (create at https://web3forms.com with gamedaytools@gmail.com)
 *   SIGNUP_TO_EMAIL       — optional, default gamedaytools@gmail.com (shown in notification body)
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function readBody(req) {
  if (req.body == null) return {};
  if (typeof req.body === "object") return req.body;
  try {
    return JSON.parse(String(req.body));
  } catch {
    return {};
  }
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const key = String(process.env.WEB3FORMS_ACCESS_KEY || "").trim();
  const toEmail = String(
    process.env.SIGNUP_TO_EMAIL || "gamedaytools@gmail.com"
  ).trim();

  if (!key) {
    return res.status(503).json({
      ok: false,
      error: "Signup not configured (missing WEB3FORMS_ACCESS_KEY)"
    });
  }

  const body = readBody(req);
  const email = String(body.email || "").trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ ok: false, error: "Enter a valid email address." });
  }

  /* Honeypot — bots fill hidden fields */
  if (String(body.company || body.website || "").trim()) {
    return res.status(200).json({ ok: true });
  }

  try {
    const upstream = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({
        access_key: key,
        subject: "UnlockIST — launch reminder signup",
        name: "UnlockIST signup",
        email,
        replyto: email,
        to: toEmail,
        message: [
          "New UnlockIST launch reminder request.",
          `Email: ${email}`,
          `Inbox: ${toEmail}`,
          `Source: ${String(body.source || "unlockist-home")}`,
          `When: ${new Date().toISOString()}`
        ].join("\n")
      })
    });

    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok || data.success === false) {
      return res.status(502).json({
        ok: false,
        error: "Could not send signup. Try again later."
      });
    }

    return res.status(200).json({ ok: true });
  } catch {
    return res.status(502).json({
      ok: false,
      error: "Could not reach mail provider. Try again later."
    });
  }
}
