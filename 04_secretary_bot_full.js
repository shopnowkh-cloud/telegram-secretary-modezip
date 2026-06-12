// ===================================
// Secretary Bot - Full Example
// + Business Message Events
// ===================================

const TelegramBot = require("node-telegram-bot-api");
const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if (!TOKEN) throw new Error("TELEGRAM_BOT_TOKEN is not set");

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

// Helper: delay function
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper: Secretary typing effect
async function secretaryType(chatId, ms = 1500) {
  await bot.sendChatAction(chatId, "typing");
  await delay(ms);
}

// ===================================
// Regular Bot Commands
// ===================================

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

// Default regular message handler
bot.on("message", async (msg) => {
  if (msg.text && !msg.text.startsWith("/")) {
    const chatId = msg.chat.id;
    await secretaryType(chatId, 1200);
    await bot.sendMessage(chatId, `✍️ ខ្ញុំបានកត់ត្រា: "${msg.text}"`);
  }
});

// ===================================
// Business Connection Event
// ===================================

bot.on("business_connection", async (bc) => {
  const { user, user_chat_id, can_reply, is_enabled, id } = bc;
  if (is_enabled) {
    console.log(`✅ Business connected: ${user.first_name} (ID: ${id})`);
    if (can_reply) {
      await secretaryType(user_chat_id, 800);
      await bot.sendMessage(
        user_chat_id,
        `👩‍💼 *Secretary Bot ភ្ជាប់ Business Account ដោយជោគជ័យ!*\n\n` +
        `✅ Bot នឹង auto-reply customer messages\n` +
        `🔑 Connection ID: \`${id}\``,
        { parse_mode: "Markdown" }
      );
    }
  } else {
    console.log(`❌ Business disconnected: ${user.first_name}`);
  }
});

// ===================================
// business_message — Customer sends message
// ===================================

bot.on("business_message", async (msg) => {
  const chatId = msg.chat.id;
  const text = (msg.text || "").toLowerCase().trim();
  const name = msg.from?.first_name || "អតិថិជន";

  console.log(`💬 [business_message] from ${name}: ${msg.text}`);

  await secretaryType(chatId, 1200);

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
      keywords: ["location", "ទីតាំង", "address", "អាសយដ្ឋាន", "នៅណា"],
      reply: `📍 *អាសយដ្ឋាន:*\n\nផ្លូវ 123, ភ្នំពេញ\n📞 ទូរស័ព្ទ: 012-345-678`,
    },
    {
      keywords: ["contact", "ទំនាក់ទំនង", "phone", "email", "ហៅ"],
      reply: `📞 *ទំនាក់ទំនង:*\n\n📱 Phone: 012-345-678\n📧 Email: info@business.com\n⏰ បម្រើ: ច-សុ 8:00-18:00`,
    },
  ];

  let matched = false;
  for (const item of replies) {
    if (item.keywords.some((kw) => text.includes(kw))) {
      await bot.sendMessage(chatId, item.reply, { parse_mode: "Markdown" });
      matched = true;
      break;
    }
  }

  if (!matched) {
    await bot.sendMessage(
      chatId,
      `👩‍💼 *សួស្ដី ${name}!*\n\n` +
      `សាររបស់អ្នកត្រូវបានទទួល ✅\n` +
      `ម្ចាស់ហាងនឹង reply ក្នុងពេលឆាប់!\n\n` +
      `💬 សួរអំពី: _"តម្លៃ"_ • _"ណាត់ជួប"_ • _"ទីតាំង"_ • _"ទំនាក់ទំនង"_`,
      { parse_mode: "Markdown" }
    );
  }
});

// ===================================
// edited_business_message — Customer edits a message
// ===================================

bot.on("edited_business_message", async (msg) => {
  const name = msg.from?.first_name || "អតិថិជន";
  console.log(`✏️ [edited_business_message] from ${name}: ${msg.text}`);

  await bot.sendMessage(
    msg.chat.id,
    `✏️ *${name}* បានកែប្រែសារ:\n\n"${msg.text}"`,
    { parse_mode: "Markdown" }
  );
});

// ===================================
// deleted_business_messages — Customer deletes messages
// ===================================

bot.on("deleted_business_messages", async (update) => {
  console.log(`🗑️ [deleted_business_messages] IDs: ${update.message_ids?.join(", ")}`);

  await bot.sendMessage(
    update.chat.id,
    `🗑️ សារ *${update.message_ids?.length || 0}* ត្រូវបានលុប\n` +
    `IDs: \`${update.message_ids?.join(", ")}\``,
    { parse_mode: "Markdown" }
  );
});

console.log("🤖 Secretary Bot started!");
console.log("📡 Listening: business_message | edited_business_message | deleted_business_messages");
