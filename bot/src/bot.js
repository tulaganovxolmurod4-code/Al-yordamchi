import "dotenv/config";
import { Telegraf, Markup } from "telegraf";

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const MINI_APP_URL = process.env.MINI_APP_URL;
const BACKEND_URL = process.env.BACKEND_URL;
const BOT_INTERNAL_SECRET = process.env.BOT_INTERNAL_SECRET;

bot.start((ctx) => {
  ctx.reply(
    "Hello. I am JARVIS, your personal AI assistant.\n\n" +
      "Open the app for the full 3D interface with voice, memory, and chat history — " +
      "or just type to me here any time.",
    Markup.inlineKeyboard([Markup.button.webApp("🚀 Open JARVIS", MINI_APP_URL)])
  );
});

bot.help((ctx) => {
  ctx.reply(
    "Just send me a message and I'll reply. Use /start to open the full 3D Mini App " +
      "with voice input, emotions, and persistent memory."
  );
});

bot.on("text", async (ctx) => {
  if (ctx.message.text.startsWith("/")) return;

  await ctx.sendChatAction("typing");
  try {
    const res = await fetch(`${BACKEND_URL}/api/bot/relay`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Bot-Secret": BOT_INTERNAL_SECRET,
      },
      body: JSON.stringify({
        telegramUser: {
          id: ctx.from.id,
          first_name: ctx.from.first_name,
          username: ctx.from.username,
          language_code: ctx.from.language_code,
        },
        message: ctx.message.text,
      }),
    });

    if (!res.ok) throw new Error(`Backend responded ${res.status}`);
    const data = await res.json();
    await ctx.reply(data.reply);
  } catch (err) {
    console.error("Relay to backend failed:", err);
    await ctx.reply("JARVIS is temporarily unavailable. Please try again shortly.");
  }
});

bot.catch((err, ctx) => {
  console.error(`Bot error for update ${ctx.update.update_id}:`, err);
});

bot.launch();
console.log("JARVIS bot is running (long polling).");

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
