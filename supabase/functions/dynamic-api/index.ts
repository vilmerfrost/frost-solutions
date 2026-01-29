// @ts-nocheck - Deno runtime, not Node.js
const encoder = new TextEncoder();

// --- Helpers: HMAC + timing-safe compare ---
async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function extractUser(payload: any) {
  const user = payload?.user ?? payload?.record ?? payload?.data?.user ?? payload?.data ?? {};
  return {
    id: user?.id ?? "—",
    email: user?.email ?? "—",
  };
}

// --- Supabase Auth Hook signature verify (whsec_...) ---
// Supabase hook-secret i UI ser ut som: "v1,whsec_xxx"
// Vi vill plocka ut själva "whsec_..." som HMAC-secret.
function normalizeHookSecret(raw: string) {
  // Ex: "v1,whsec_ABC" -> "whsec_ABC"
  const parts = raw.split(",");
  const wh = parts.find((p) => p.trim().startsWith("whsec_"));
  return (wh ?? raw).trim();
}

async function verifySupabaseHook(req: Request, bodyText: string): Promise<boolean> {
  const raw = Deno.env.get("WEBHOOK_SECRET");
  if (!raw) return true; // om du inte sätter secret -> tillåt ändå (men du borde sätta)
  const secret = normalizeHookSecret(raw);

  // Vanliga header-namn i Supabase hooks:
  const signature =
    req.headers.get("x-supabase-signature") ||
    req.headers.get("x-hook-signature") ||
    req.headers.get("x-signature");

  const timestamp =
    req.headers.get("x-supabase-timestamp") ||
    req.headers.get("x-hook-timestamp") ||
    req.headers.get("x-timestamp");

  // Om Supabase inte skickar sign-headers i din hook-version,
  // då faller vi tillbaka till en enklare "x-webhook-secret" check.
  if (!signature || !timestamp) {
    const incoming =
      req.headers.get("x-webhook-secret") ||
      req.headers.get("authorization")?.replace("Bearer ", "");

    return incoming ? incoming === raw || incoming === secret : true;
  }

  // Message-format: "v1:{timestamp}:{rawBody}" (vanligt webhook-mönster)
  // Om din hook använder annan standard ser vi det i logs och justerar.
  const msg = `v1:${timestamp}:${bodyText}`;
  const expected = await hmacSha256Hex(secret, msg);

  // Signature kan komma som "v1,hexsig" eller bara "hexsig"
  const sigParts = signature.split(",");
  const sigHex = (sigParts.find((p) => /^[0-9a-f]{40,}$/i.test(p.trim())) ?? signature).trim();

  return timingSafeEqual(sigHex.toLowerCase(), expected.toLowerCase());
}

Deno.serve(async (req) => {
  // 1) Läs raw body (viktigt för signature verify)
  const bodyText = await req.text();

  // 2) Starta "background work" men blocka aldrig signup
  //    Vi svarar 200 {} ASAP, men kör resten async.
  //    I Deno kan vi bara starta async funktioner direkt (fire-and-forget)
  (async () => {
    try {
      const ok = await verifySupabaseHook(req, bodyText);
      if (!ok) {
        console.log("Auth hook: signature check failed");
        return;
      }

      const resendKey = Deno.env.get("RESEND_API_KEY");
      const notifyTo = Deno.env.get("NOTIFY_TO_EMAIL");
      if (!resendKey || !notifyTo) {
        console.log("Auth hook: missing RESEND_API_KEY or NOTIFY_TO_EMAIL");
        return;
      }

      let payload: any = {};
      try {
        payload = JSON.parse(bodyText || "{}");
      } catch {
        console.log("Auth hook: body not JSON");
        return;
      }

      const { email, id } = extractUser(payload);

      const resp = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Frost Solutions <onboarding@resend.dev>",
          to: [notifyTo],
          subject: `🎉 Ny signup: ${email}`,
          text: `Ny användare skapades!\n\nEmail: ${email}\nUser ID: ${id}\n`,
        }),
      });

      if (!resp.ok) {
        const t = await resp.text();
        console.log("Resend error:", resp.status, t.slice(0, 300));
      } else {
        console.log("Signup notify sent:", email);
      }
    } catch (e) {
      console.log("Auth hook background error:", String(e));
    }
  })();

  // 3) VIKTIGT: Tillåt signup alltid
  return new Response(JSON.stringify({}), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
});