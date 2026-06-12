// ===================================
// Secretary Mode - Long Task
// Keep typing action alive (loop every 4s)
// ===================================

const TelegramBot = require("node-telegram-bot-api");
const TOKEN = "YOUR_BOT_TOKEN_HERE";
const bot = new TelegramBot(TOKEN, { polling: true });

// ⚠️ Telegram action ផុតអស់ក្នុង 5 វិនាទី
// ដូច្នេះត្រូវ loop វារៀងរាល់ 4 វិនាទី

async function keepTyping(chatId, durationMs) {
  const interval = setInterval(() => {
    bot.sendChatAction(chatId, "typing").catch(() => {});
  }, 4000);

  // ផ្ញើ action ភ្លាមៗ
  await bot.sendChatAction(chatId, "typing");

  // រង់ចាំ task ឱ្យចប់
  await new Promise((resolve) => setTimeout(resolve, durationMs));

  clearInterval(interval);
}

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;

  await bot.sendMessage(chatId, "⏳ កំពុងដំណើរការ task យូរ...");

  // Secretary Mode រត់ 10 វិនាទី
  await keepTyping(chatId, 10000);

  await bot.sendMessage(chatId, "✅ Task រួចរាល់ហើយ!");
});
