// ===================================
// Secretary Bot - Keyboard Button Mode
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

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ===================================
// Main Reply Keyboard
// ===================================
const mainKeyboard = {
  reply_markup: {
    keyboard: [
      ["📅 ណាត់ជួប", "⏰ រំលឹក"],
      ["📝 កត់ត្រា", "📡 Connections"],
      ["📊 Status", "ℹ️ ជំនួយ"],
    ],
    resize_keyboard: true,
    persistent: true,
  },
};

// ===================================
// Store: business_connection_id → owner info
// ===================================
const businessConnections = new Map();

// ===================================
// Helper: Secretary typing effect
// ===================================
async function secretaryType(chatId, ms = 1500) {
  await bot.sendChatAction(chatId, "typing");
  await delay(ms);
}

// ===================================
// /start — show keyboard
// ===================================
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  await secretaryType(chatId, 800);
  await bot.sendMessage(
    chatId,
    "👩‍💼 *សួស្ដី! ខ្ញុំជា Secretary Bot!*\n\nជ្រើសរើសពី keyboard ខាងក្រោម 👇",
    { parse_mode: "Markdown", ...mainKeyboard }
  );
});

// ===================================
// Regular message handler — Keyboard buttons
// ===================================
bot.on("message", async (msg) => {
  if (!msg.text || msg.text.startsWith("/")) return;

  const chatId = msg.chat.id;
  const text = msg.text.trim();

  await bot.sendChatAction(chatId, "typing");
  await delay(1000);

  // --- 📅 ណាត់ជួប ---
  if (text === "📅 ណាត់ជួប") {
    return bot.sendMessage(
      chatId,
      "📅 *ណាត់ជួប*\n\nសូមប្រាប់ព័ត៌មានខាងក្រោម:\n• 📆 កាលបរិច្ឆេទ\n• 🕐 ម៉ោង\n• 📍 ទីកន្លែង",
      { parse_mode: "Markdown", ...mainKeyboard }
    );
  }

  // --- ⏰ រំលឹក ---
  if (text === "⏰ រំលឹក") {
    return bot.sendMessage(
      chatId,
      "⏰ *រំលឹក*\n\nសូមប្រាប់:\n• 📆 ថ្ងៃ + ម៉ោងដែលចង់រំលឹក\n• 📝 អ្វីដែលត្រូវរំលឹក",
      { parse_mode: "Markdown", ...mainKeyboard }
    );
  }

  // --- 📝 កត់ត្រា ---
  if (text === "📝 កត់ត្រា") {
    return bot.sendMessage(
      chatId,
      "📝 *កត់ត្រា*\n\nសូមវាយអ្វីដែលចង់កត់ត្រា...\nខ្ញុំនឹងរក្សាទុកជូន!",
      { parse_mode: "Markdown", ...mainKeyboard }
    );
  }

  // --- 📡 Connections ---
  if (text === "📡 Connections") {
    if (businessConnections.size === 0) {
      return bot.sendMessage(
        chatId,
        "📡 មិនទាន់មាន Business Connection ណាមួយទេ។\n\nភ្ជាប់ bot ទៅ Telegram Business ជាមុនសិន!",
        mainKeyboard
      );
    }
    let list = `📡 *Business Connections (${businessConnections.size}):*\n\n`;
    for (const [bcId, info] of businessConnections) {
      list += `👤 *${info.ownerName}*\n`;
      list += `🔑 \`${bcId}\`\n`;
      list += `🕐 ${new Date(info.connectedAt).toLocaleString()}\n\n`;
    }
    return bot.sendMessage(chatId, list, { parse_mode: "Markdown", ...mainKeyboard });
  }

  // --- 📊 Status ---
  if (text === "📊 Status") {
    return bot.sendMessage(
      chatId,
      `📊 *Bot Status*\n\n` +
      `🤖 Bot: ✅ Online\n` +
      `📡 Business Connections: *${businessConnections.size}*\n` +
      `🕐 Server Time: ${new Date().toLocaleString()}\n` +
      `📦 Library: node-telegram-bot-api v0.67.0`,
      { parse_mode: "Markdown", ...mainKeyboard }
    );
  }

  // --- ℹ️ ជំនួយ ---
  if (text === "ℹ️ ជំនួយ") {
    return bot.sendMessage(
      chatId,
      `ℹ️ *ជំនួយ*\n\n` +
      `📅 *ណាត់ជួប* — ណាត់ meeting\n` +
      `⏰ *រំលឹក* — set reminder\n` +
      `📝 *កត់ត្រា* — save notes\n` +
      `📡 *Connections* — business connections\n` +
      `📊 *Status* — មើលស្ថានភាព bot\n\n` +
      `🏢 Bot នេះ support Telegram Business Chat!\n` +
      `Customer messages នឹង auto-reply ស្វ័យប្រវត្តិ។`,
      { parse_mode: "Markdown", ...mainKeyboard }
    );
  }

  // --- Default: record any other text ---
  await bot.sendMessage(
    chatId,
    `✍️ ខ្ញុំបានកត់ត្រា:\n"${text}"`,
    mainKeyboard
  );
});

// ===================================
// business_connection — Store owner info
// ===================================
bot.on("business_connection", async (bc) => {
  const { user, user_chat_id, can_reply, is_enabled, id } = bc;

  if (is_enabled) {
    businessConnections.set(id, {
      ownerChatId: user_chat_id,
      ownerName: user.first_name,
      connectedAt: Date.now(),
    });

    console.log(`✅ Business connected: ${user.first_name} | bcId: ${id}`);

    if (can_reply) {
      await secretaryType(user_chat_id, 800);
      await bot.sendMessage(
        user_chat_id,
        `👩‍💼 *Secretary Bot ភ្ជាប់ Business Account ដោយជោគជ័យ!*\n\n` +
        `✅ Bot នឹង auto-reply customer messages\n` +
        `🔑 Connection ID: \`${id}\``,
        { parse_mode: "Markdown", ...mainKeyboard }
      );
    }
  } else {
    businessConnections.delete(id);
    console.log(`❌ Business disconnected: ${user.first_name} | bcId: ${id}`);
    await bot.sendMessage(
      user_chat_id,
      `⚠️ *Secretary Bot ត្រូវបានផ្ដាច់ចេញ*\n\nBusiness Connection \`${id}\` បានបិទ។`,
      { parse_mode: "Markdown", ...mainKeyboard }
    );
  }
});

// ===================================
// business_message — Auto-reply to customer
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

  // No default reply — owner handles unmatched messages manually
});

// ===================================
// edited_business_message — Notify owner
// ===================================
bot.on("edited_business_message", async (msg) => {
  const name = msg.from?.first_name || "អតិថិជន";
  const bcId = msg.business_connection_id;
  const conn = businessConnections.get(bcId);

  console.log(`✏️ [edited_business_message] from ${name} | bcId: ${bcId}`);

  if (conn?.ownerChatId) {
    await bot.sendMessage(
      conn.ownerChatId,
      `✏️ *Customer កែប្រែសារ!*\n\n` +
      `👤 Customer: *${name}*\n` +
      `💬 សារថ្មី: "${msg.text}"\n` +
      `🔑 bcId: \`${bcId}\``,
      { parse_mode: "Markdown" }
    );
  }
});

// ===================================
// deleted_business_messages — Notify owner only
// ===================================
bot.on("deleted_business_messages", async (update) => {
  const bcId = update.business_connection_id;
  const messageIds = update.message_ids || [];
  const customerChatId = update.chat?.id;
  const conn = businessConnections.get(bcId);

  console.log(`🗑️ [deleted_business_messages] IDs: ${messageIds.join(", ")} | bcId: ${bcId}`);

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
    console.warn(`⚠️ No owner found for bcId: ${bcId}`);
  }
});

console.log("🤖 Secretary Bot started!");
console.log("📡 Listening: business_message | edited_business_message | deleted_business_messages");
