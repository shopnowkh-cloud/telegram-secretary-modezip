// ===================================
// Secretary Bot - Full Example
// ===================================

const TelegramBot = require("node-telegram-bot-api");
const TOKEN = "YOUR_BOT_TOKEN_HERE";
const bot = new TelegramBot(TOKEN, { polling: true });

// Helper: delay function
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper: Secretary typing effect
async function secretaryType(chatId, ms = 1500) {
  await bot.sendChatAction(chatId, "typing");
  await delay(ms);
}

// Commands
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  await secretaryType(chatId, 1000);
  await bot.sendMessage(
    chatId,
    "👩‍💼 សួស្ដី! ខ្ញុំជា Secretary Bot!\n\nខ្ញុំអាចជួយអ្នក:\n/appointment - ណាត់ជួប\n/remind - រំលឹក\n/note - កត់ត្រា"
  );
});

bot.onText(/\/appointment/, async (msg) => {
  const chatId = msg.chat.id;
  await secretaryType(chatId, 2000);
  await bot.sendMessage(chatId, "📅 សូមប្រាប់ព័ត៌មានណាត់ជួប:\nកាលបរិច្ឆេទ, ម៉ោង, ទីកន្លែង");
});

bot.onText(/\/remind/, async (msg) => {
  const chatId = msg.chat.id;
  await secretaryType(chatId, 1500);
  await bot.sendMessage(chatId, "⏰ នឹងរំលឹកអ្នក! សូមប្រាប់ម៉ោងដែលចង់ទទួលការរំលឹក។");
});

bot.onText(/\/note/, async (msg) => {
  const chatId = msg.chat.id;
  await secretaryType(chatId, 1000);
  await bot.sendMessage(chatId, "📝 សូមវាយអ្វីដែលចង់កត់ត្រា...");
});

// Default message handler
bot.on("message", async (msg) => {
  if (msg.text && !msg.text.startsWith("/")) {
    const chatId = msg.chat.id;
    await secretaryType(chatId, 1200);
    await bot.sendMessage(chatId, `✍️ ខ្ញុំបានកត់ត្រា: "${msg.text}"`);
  }
});

console.log("🤖 Secretary Bot started!");
