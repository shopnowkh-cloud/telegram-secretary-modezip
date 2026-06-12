// =====================================================
// Telegram Bot Business - Chat Automation
// Add to Chat / Business Connection Handler
// =====================================================
// ⚠️ តម្រូវការ: Telegram Bot API 7.2+ (Business Features)
// ✅ ត្រូវ Enable: Bot Settings > Allow in Business
// =====================================================

const TelegramBot = require("node-telegram-bot-api");
const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if (!TOKEN) throw new Error("TELEGRAM_BOT_TOKEN is not set");

const bot = new TelegramBot(TOKEN, {
  polling: {
    params: {
      allowed_updates: [
        "message",
        "business_connection",       // ពេល user connect bot ទៅ business
        "business_message",          // message ពី business chat
        "edited_business_message",   // message ដែលបានកែប្រែ
        "deleted_business_messages", // messages ដែលបានលុប
      ],
    },
  },
});

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

// =====================================================
// 1. Business Connection Event
//    ជាប់ trigger ពេល user Add Bot ទៅ Business Account
// =====================================================
bot.on("business_connection", async (connection) => {
  console.log("📡 Business Connection:", JSON.stringify(connection, null, 2));

  const {
    id: connectionId,
    user,
    user_chat_id,
    date,
    can_reply,
    is_enabled,
  } = connection;

  if (is_enabled) {
    // ✅ Bot ត្រូវបាន Add ទៅ Business Chat
    console.log(`✅ Bot connected to business account of user: ${user.first_name}`);
    console.log(`   Connection ID: ${connectionId}`);
    console.log(`   Can Reply: ${can_reply}`);

    // ផ្ញើសារស្វាគមន៍ទៅ Business Owner
    if (can_reply) {
      await bot.sendMessage(
        user_chat_id,
        `👩‍💼 *Secretary Bot បានភ្ជាប់ដោយជោគជ័យ!*\n\n` +
        `✅ Bot របស់អ្នកឥឡូវនេះអាច:\n` +
        `• ឆ្លើយតបស្វ័យប្រវត្តិជំនួសអ្នក\n` +
        `• បង្ហាញ typing indicator\n` +
        `• គ្រប់គ្រង customer messages\n\n` +
        `🔑 Connection ID: \`${connectionId}\``,
        { parse_mode: "Markdown" }
      );
    }
  } else {
    // ❌ Bot ត្រូវបាន Remove ចេញពី Business Chat
    console.log(`❌ Bot disconnected from business account of user: ${user.first_name}`);
  }
});

// =====================================================
// 2. Business Message Handler
//    Automation ឆ្លើយតប Customer Messages
// =====================================================
bot.on("business_message", async (msg) => {
  console.log("💬 Business Message received:", msg.text);

  const chatId = msg.chat.id;
  const text = (msg.text || "").toLowerCase();
  const customerName = msg.from?.first_name || "អតិថិជន";

  // Secretary Mode: បង្ហាញ typing...
  await bot.sendChatAction(chatId, "typing");
  await delay(1500);

  // =====================================================
  // Auto-Reply Logic based on keywords
  // =====================================================

  // ១. សួរអំពីតម្លៃ
  if (text.includes("តម្លៃ") || text.includes("price") || text.includes("ប៉ុន្មាន")) {
    await bot.sendMessage(
      chatId,
      `💰 *សួស្ដី ${customerName}!*\n\n` +
      `នេះជាបញ្ជីតម្លៃរបស់យើង:\n\n` +
      `📦 Package A: $10/ខែ\n` +
      `📦 Package B: $25/ខែ\n` +
      `📦 Package C: $50/ខែ\n\n` +
      `សម្រាប់ព័ត៌មានបន្ថែម សូម reply មក!`,
      { parse_mode: "Markdown" }
    );

  // ២. ណាត់ជួប / Appointment
  } else if (text.includes("ណាត់") || text.includes("appointment") || text.includes("book")) {
    await bot.sendMessage(
      chatId,
      `📅 *ណាត់ជួប*\n\n` +
      `សូម ${customerName} ជ្រើសរើសម៉ោងដែលងាយស្រួល:\n\n` +
      `🕐 ព្រឹក: 9:00 - 12:00\n` +
      `🕑 រសៀល: 14:00 - 17:00\n\n` +
      `Reply ម៉ោងដែលចង់ណាត់!`,
      { parse_mode: "Markdown" }
    );

  // ៣. សំណួរអំពីម៉ោងបើក
  } else if (text.includes("ម៉ោង") || text.includes("open") || text.includes("hour")) {
    await bot.sendMessage(
      chatId,
      `🕐 *ម៉ោងបើក-បិទ*\n\n` +
      `📅 ច័ន្ទ - សុក្រ: 8:00 - 18:00\n` +
      `📅 សៅរ៍: 8:00 - 12:00\n` +
      `❌ អាទិត្យ: បិទ\n\n` +
      `📞 សម្រាប់បញ្ហាបន្ទាន់: 012-345-678`,
      { parse_mode: "Markdown" }
    );

  // ៤. Thank you / អរគុណ
  } else if (text.includes("អរគុណ") || text.includes("thank")) {
    await bot.sendMessage(
      chatId,
      `🙏 អរគុណ ${customerName} ដែរ!\n` +
      `រីករាយនឹងបម្រើអ្នកជានិច្ច 😊`
    );

  // ៥. Default Auto-Reply
  } else {
    await bot.sendMessage(
      chatId,
      `👩‍💼 *សួស្ដី ${customerName}!*\n\n` +
      `យើងបានទទួលសាររបស់អ្នករួចហើយ។\n` +
      `ម្ចាស់ហាងនឹងឆ្លើយតបក្នុងពេលឆាប់ៗ!\n\n` +
      `⏰ ម៉ោងបម្រើ: 8:00 - 18:00\n\n` +
      `💬 អ្នកអាចសួរអំពី:\n` +
      `• តម្លៃ → វាយ "តម្លៃ"\n` +
      `• ណាត់ជួប → វាយ "ណាត់"\n` +
      `• ម៉ោងបើក → វាយ "ម៉ោង"`,
      { parse_mode: "Markdown" }
    );
  }
});

// =====================================================
// 3. Edited Business Message
// =====================================================
bot.on("edited_business_message", async (msg) => {
  console.log("✏️ Message edited in business chat:", msg.text);
  // Handle edited messages if needed
});

// =====================================================
// 4. Deleted Business Messages
// =====================================================
bot.on("deleted_business_messages", async (update) => {
  console.log("🗑️ Messages deleted in business chat:", update.message_ids);
});

// =====================================================
// Regular /start command
// =====================================================
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  await bot.sendChatAction(chatId, "typing");
  await delay(1000);
  await bot.sendMessage(
    chatId,
    `👩‍💼 *Secretary Bot - Business Edition*\n\n` +
    `🔧 *របៀបភ្ជាប់ Bot ទៅ Business Account:*\n\n` +
    `1️⃣ ទៅ Telegram Settings\n` +
    `2️⃣ ជ្រើស "Telegram Business"\n` +
    `3️⃣ ជ្រើស "Chatbots"\n` +
    `4️⃣ Add bot username របស់អ្នក\n` +
    `5️⃣ Enable "Reply to messages"\n\n` +
    `✅ Bot នឹង auto-reply ជំនួសអ្នក!`,
    { parse_mode: "Markdown" }
  );
});

console.log("🤖 Business Secretary Bot is running...");
console.log("📡 Listening for business_connection events...");
