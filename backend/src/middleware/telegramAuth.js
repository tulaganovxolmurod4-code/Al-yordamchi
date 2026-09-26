import crypto from "crypto";

function verifyInitData(initData, botToken) {
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return null;
  params.delete("hash");

  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");

  const secretKey = crypto.createHmac("sha256", "WebAppData").update(botToken).digest();
  const computedHash = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

  if (computedHash !== hash) return null;

  const authDate = Number(params.get("auth_date") || 0);
  const ageSeconds = Date.now() / 1000 - authDate;
  if (!authDate || ageSeconds > 60 * 60 * 24) return null;

  const userJson = params.get("user");
  if (!userJson) return null;

  try {
    return JSON.parse(userJson);
  } catch {
    return null;
  }
}

export function telegramAuthMiddleware(req, res, next) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const initData = req.headers["x-telegram-init-data"];
  const devBypass = process.env.ALLOW_DEV_NO_AUTH === "true";

  if (!initData) {
    if (devBypass) {
      req.telegramUser = { id: 999999, first_name: "DevUser", username: "dev", language_code: "en" };
      return next();
    }
    return res.status(401).json({ error: "Missing Telegram authentication." });
  }

  const user = verifyInitData(initData, botToken);
  if (!user) {
    return res.status(401).json({ error: "Invalid or expired Telegram session." });
  }

  req.telegramUser = user;
  next();
}
