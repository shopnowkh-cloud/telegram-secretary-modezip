// ===================================
// Secretary Mode (sendChatAction)
// Telegram Bot - Basic Example
// ===================================

const TelegramBot = require("node-telegram-bot-api");

const TOKEN = "YOUR_BOT_TOKEN_HERE";
const bot = new TelegramBot(TOKEN, { polling: true });

// Secretary Mode: បង្ហាញ "typing..." មុនពេលឆ្លើយ
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;

  // 🔑 Secretary Mode - sendChatAction
  await bot.sendChatAction(chatId, "typing");

  // Simulate processing time (1.5 seconds)
  await new Promise((resolve) => setTimeout(resolve, 1500));

  await bot.sendMessage(chatId, "សួស្ដី! ខ្ញុំជា Secretary Bot 🤖");
});

console.log("Secretary Bot is running...");
