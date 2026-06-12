// =====================================================
// Telegram Business Bot - Setup & Configuration Guide
// =====================================================
// តម្រូវការ BotFather Settings:
//   ✅ /mybots > [your bot] > Bot Settings > Allow in Business
// =====================================================

const TelegramBot = require("node-telegram-bot-api");
const TOKEN = "YOUR_BOT_TOKEN_HERE";

// =====================================================
// Business Bot Configuration
// =====================================================
const BUSINESS_CONFIG = {
  // Auto-reply ពេល owner offline
  autoReplyEnabled: true,

  // ម៉ោង online (24h format)
  workingHours: { start: 8, end: 18 },

  // ម៉ោងបិទ Auto-reply message
  offHoursMessage:
    "🌙 ឥឡូវក្រៅម៉ោងបម្រើ (8:00-18:00)\nនឹងឆ្លើយតបនៅព្រឹកថ្ងៃស្អែក! 🙏",

  // Welcome message
  welcomeMessage: "👩‍💼 សួស្ដីពី Secretary Bot!\nតើខ្ញុំអាចជួយអ្វីបានខ្លះ?",
};

const bot = new TelegramBot(TOKEN, {
  polling: {
    params: {
      allowed_updates: [
        "message",
        "business_connection",
        "business_message",
        "edited_business_message",
        "deleted_business_messages",
      ],
    },
  },
});

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

// Helper: Check if within working hours
function isWorkingHours() {
  const hour = new Date().getHours();
  return hour >= BUSINESS_CONFIG.workingHours.start &&
         hour < BUSINESS_CONFIG.workingHours.end;
}

// Helper: Secretary typing effect
async function secretaryType(chatId, ms = 1500) {
  await bot.sendChatAction(chatId, "typing");
  await delay(ms);
}

// =====================================================
// Business Connection - Add/Remove Bot from Business
// =====================================================
bot.on("business_connection", async (bc) => {
  const { user, user_chat_id, can_reply, is_enabled, id } = bc;

  if (is_enabled && can_reply) {
    console.log(`✅ Connected: ${user.first_name} (ID: ${id})`);

    await secretaryType(user_chat_id, 800);
    await bot.sendMessage(
      user_chat_id,
      `🎉 *Bot ភ្ជាប់ Business Account ដោយជោគជ័យ!*\n\n` +
      `👩‍💼 Secretary Bot នឹង:\n` +
      `• Auto-reply customer messages\n` +
      `• បង្ហាញ typing indicator\n` +
      `• ឆ្លើយតបស្វ័យប្រវត្តិ ២៤/៧\n\n` +
      `⚙️ Commands:\n` +
      `/status - មើលស្ថានភាព bot\n` +
      `/pause - ផ្អាក auto-reply\n` +
      `/resume - បើក auto-reply`,
      { parse_mode: "Markdown" }
    );
  } else if (!is_enabled) {
    console.log(`❌ Disconnected: ${user.first_name}`);
  }
});

// =====================================================
// Business Message Automation
// =====================================================
bot.on("business_message", async (msg) => {
  const chatId = msg.chat.id;
  const text = (msg.text || "").toLowerCase().trim();
  const name = msg.from?.first_name || "អតិថិជន";

  // Skip ប្រសិនបើ auto-reply បិទ
  if (!BUSINESS_CONFIG.autoReplyEnabled) return;

  // ម៉ោងក្រៅការងារ
  if (!isWorkingHours()) {
    await secretaryType(chatId, 1000);
    await bot.sendMessage(chatId, BUSINESS_CONFIG.offHoursMessage);
    return;
  }

  await secretaryType(chatId, 1200);

  // Keyword matching
  const replies = [
    {
      keywords: ["hello", "hi", "សួស្ដី", "ជំរាបសួរ"],
      reply: `👋 *សួស្ដី ${name}!*\nរីករាយនឹងបម្រើ! តើអ្នកត្រូវការអ្វី?`,
    },
    {
      keywords: ["តម្លៃ", "price", "cost", "ប៉ុន្មាន", "ថ្លៃ"],
      reply: `💰 *តម្លៃសេវាកម្ម:*\n\n• Basic: $10/ខែ\n• Pro: $25/ខែ\n• Enterprise: $50/ខែ\n\nចុះឈ្មោះឥឡូវ ទទួលបានបញ្ចុះតម្លៃ 20%! 🎁`,
    },
    {
      keywords: ["ណាត់", "appointment", "book", "meeting", "ជួប"],
      reply: `📅 *ណាត់ជួប*\n\nម៉ោងទំនេរ:\n🕘 ព្រឹក 9:00-11:00\n🕑 រសៀល 14:00-16:00\n\nReply ថ្ងៃ + ម៉ោង ដែលងាយស្រួល!`,
    },
    {
      keywords: ["location", "ទីតាំង", "address", "អាសយដ្ឋាន", "នៅ​ណា"],
      reply: `📍 *អាសយដ្ឋាន:*\n\nផ្លូវ 123, ភ្នំពេញ\n\n🗺️ Google Maps: https://maps.google.com\n\n📞 ទូរស័ព្ទ: 012-345-678`,
    },
    {
      keywords: ["contact", "ទំនាក់ទំនង", "phone", "email", "ហៅ"],
      reply: `📞 *ទំនាក់ទំនង:*\n\n📱 Phone: 012-345-678\n📧 Email: info@business.com\n🌐 Web: www.business.com\n\n⏰ បម្រើ: ច-សុ 8:00-18:00`,
    },
  ];

  // ស្វែងរក matching reply
  let matched = false;
  for (const item of replies) {
    if (item.keywords.some((kw) => text.includes(kw))) {
      await bot.sendMessage(chatId, item.reply, { parse_mode: "Markdown" });
      matched = true;
      break;
    }
  }

  // Default reply
  if (!matched) {
    await bot.sendMessage(
      chatId,
      `👩‍💼 *សួស្ដី ${name}!*\n\n` +
      `សាររបស់អ្នកត្រូវបានទទួល ✅\n` +
      `ម្ចាស់ហាងនឹង reply ក្នុងពេលឆាប់!\n\n` +
      `💬 ឬសួរអំពី:\n` +
      `_"តម្លៃ"_ • _"ណាត់ជួប"_ • _"ទីតាំង"_ • _"ទំនាក់ទំនង"_`,
      { parse_mode: "Markdown" }
    );
  }
});

// =====================================================
// Owner Commands (Regular chat with bot)
// =====================================================
bot.onText(/\/status/, async (msg) => {
  const chatId = msg.chat.id;
  await secretaryType(chatId, 500);
  await bot.sendMessage(
    chatId,
    `📊 *Bot Status:*\n\n` +
    `• Auto-Reply: ${BUSINESS_CONFIG.autoReplyEnabled ? "✅ ON" : "❌ OFF"}\n` +
    `• Working Hours: ${BUSINESS_CONFIG.workingHours.start}:00 - ${BUSINESS_CONFIG.workingHours.end}:00\n` +
    `• Current Time: ${new Date().getHours()}:${String(new Date().getMinutes()).padStart(2, "0")}\n` +
    `• Status: ${isWorkingHours() ? "🟢 Online" : "🔴 Off Hours"}`,
    { parse_mode: "Markdown" }
  );
});

bot.onText(/\/pause/, async (msg) => {
  BUSINESS_CONFIG.autoReplyEnabled = false;
  await bot.sendMessage(msg.chat.id, "⏸️ Auto-reply បានផ្អាក!\nUse /resume ដើម្បីបើកវិញ។");
});

bot.onText(/\/resume/, async (msg) => {
  BUSINESS_CONFIG.autoReplyEnabled = true;
  await bot.sendMessage(msg.chat.id, "▶️ Auto-reply បានបើកវិញ! ✅");
});

console.log("🤖 Business Bot started!");
console.log("📡 Waiting for business connections...");
