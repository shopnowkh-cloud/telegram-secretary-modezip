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

// Helper: Secretary typing effect (regular chat)
async function secretaryType(chatId, ms = 1500) {
  await bot.sendChatAction(chatId, "typing");
  await delay(ms);
}

// ===================================
// Store: business_connection_id → owner info
// ====================================
// Map: bcId → { ownerChatId, ownerName, connectedAt }
const businessConnections = new Map();

// ===================================
// Regular Bot Commands
// ===================================

bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  await secretaryType(chatId, 1000);
  await bot.sendMessage(
    chatId,
    "👩‍💼 សួស្ដី! ខ្ញុំជា Secretary Bot!\n\nខ្ញុំអាចជួយអ្នក:\n/appointment - ណាត់ជួប\n/remind - រំលឹក\n/note - កត់ត្រា\n/connections - មើល Business Connections"
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

bot.onText(/\/connections/, async (msg) => {
  const chatId = msg.chat.id;
  await secretaryType(chatId, 800);
  if (businessConnections.size === 0) {
    return bot.sendMessage(chatId, "📡 មិនទាន់មាន Business Connection ណាមួយទេ។");
  }
  let list = `📡 *Business Connections (${businessConnections.size}):*\n\n`;
  for (const [bcId, info] of businessConnections) {
    list += `👤 *${info.ownerName}*\n`;
    list += `🔑 \`${bcId}\`\n`;
    list += `🕐 ${new Date(info.connectedAt).toLocaleString()}\n\n`;
  }
  await bot.sendMessage(chatId, list, { parse_mode: "Markdown" });
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
// business_connection — Store owner info
// ===================================

bot.on("business_connection", async (bc) => {
  const { user, user_chat_id, can_reply, is_enabled, id } = bc;

  if (is_enabled) {
    // ✅ Save owner info mapped to business_connection_id
    businessConnections.set(id, {
      ownerChatId: user_chat_id,
      ownerName: user.first_name,
      connectedAt: Date.now(),
    });

    console.log(`✅ Business connected: ${user.first_name} | bcId: ${id} | ownerChatId: ${user_chat_id}`);

    if (can_reply) {
      await secretaryType(user_chat_id, 800);
      await bot.sendMessage(
        user_chat_id,
        `👩‍💼 *Secretary Bot ភ្ជាប់ Business Account ដោយជោគជ័យ!*\n\n` +
        `✅ Bot នឹង auto-reply customer messages\n` +
        `🔑 Connection ID: \`${id}\`\n\n` +
        `📋 Commands:\n` +
        `/connections - មើល connections ទាំងអស់`,
        { parse_mode: "Markdown" }
      );
    }
  } else {
    // ❌ Remove from map when disconnected
    businessConnections.delete(id);
    console.log(`❌ Business disconnected: ${user.first_name} | bcId: ${id}`);
    await bot.sendMessage(
      user_chat_id,
      `⚠️ *Secretary Bot ត្រូវបានផ្ដាច់ចេញ*\n\nBusiness Connection \`${id}\` បានបិទ។`,
      { parse_mode: "Markdown" }
    );
  }
});

// ===================================
// business_message — Customer sends message
// ===================================

bot.on("business_message", async (msg) => {
  const chatId = msg.chat.id;
  const text = (msg.text || "").toLowerCase().trim();
  const name = msg.from?.first_name || "អតិថិជន";
  const bcId = msg.business_connection_id;

  console.log(`💬 [business_message] from ${name} | bcId: ${bcId}`);

  await bot.sendChatAction(chatId, "typing", { business_connection_id: bcId });
  await delay(1200);

  const sendReply = (replyText, opts = {}) =>
    bot.sendMessage(chatId, replyText, { business_connection_id: bcId, ...opts });

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
      await sendReply(item.reply, { parse_mode: "Markdown" });
      matched = true;
      break;
    }
  }

  if (!matched) {
    await sendReply(
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
  const bcId = msg.business_connection_id;
  const conn = businessConnections.get(bcId);

  console.log(`✏️ [edited_business_message] from ${name} | bcId: ${bcId}`);

  // Notify owner in their private chat with bot
  if (conn?.ownerChatId) {
    await bot.sendMessage(
      conn.ownerChatId,
      `✏️ *Customer កែប្រែសារ!*\n\n` +
      `👤 Customer: *${name}*\n` +
      `💬 សារថ្មី: "${msg.text}"\n` +
      `🔑 bcId: \`${bcId}\``,
      { parse_mode: "Markdown" }
    );
  } else {
    console.warn(`⚠️ No owner found for bcId: ${bcId}`);
  }
});

// ===================================
// deleted_business_messages — Notify owner, NOT customer
// ===================================

bot.on("deleted_business_messages", async (update) => {
  const bcId = update.business_connection_id;
  const messageIds = update.message_ids || [];
  const customerChatId = update.chat?.id;
  const conn = businessConnections.get(bcId);

  console.log(`🗑️ [deleted_business_messages] IDs: ${messageIds.join(", ")} | bcId: ${bcId} | customerChatId: ${customerChatId}`);

  // ✅ Correct: notify OWNER in private chat (cannot reply to customer about deletions)
  if (conn?.ownerChatId) {
    await bot.sendMessage(
      conn.ownerChatId,
      `🗑️ *Customer បានលុបសារ!*\n\n` +
      `👥 Chat ID: \`${customerChatId}\`\n` +
      `📋 លុបសារចំនួន: *${messageIds.length}*\n` +
      `🆔 Message IDs: \`${messageIds.join(", ")}\`\n` +
      `🔑 bcId: \`${bcId}\`\n` +
      `🕐 ${new Date().toLocaleString()}`,
      { parse_mode: "Markdown" }
    );
  } else {
    // Fallback: log only — no owner chat found
    console.warn(`⚠️ deleted_business_messages: owner not found for bcId: ${bcId}. Cannot notify.`);
    console.warn(`   Customer Chat ID: ${customerChatId}`);
    console.warn(`   Deleted IDs: ${messageIds.join(", ")}`);
  }
});

console.log("🤖 Secretary Bot started!");
console.log("📡 Listening: business_message | edited_business_message | deleted_business_messages");
