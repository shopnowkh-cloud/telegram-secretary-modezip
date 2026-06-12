const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if (!TOKEN) throw new Error("TELEGRAM_BOT_TOKEN is not set");

const bot = new TelegramBot(TOKEN, {
  polling: {
    params: {
      allowed_updates: [
        "message",
        "business_connection",
        "deleted_business_messages",
      ],
    },
  },
});

// ===================================
// Persist owner chat ID across restarts
// ===================================
const CONNECTIONS_FILE = "./connections.json";

function loadConnections() {
  try {
    if (fs.existsSync(CONNECTIONS_FILE)) {
      const data = JSON.parse(fs.readFileSync(CONNECTIONS_FILE, "utf8"));
      return new Map(Object.entries(data));
    }
  } catch (e) {
    console.error("⚠️ Failed to load connections:", e.message);
  }
  return new Map();
}

function saveConnections(map) {
  try {
    fs.writeFileSync(CONNECTIONS_FILE, JSON.stringify(Object.fromEntries(map), null, 2));
  } catch (e) {
    console.error("⚠️ Failed to save connections:", e.message);
  }
}

const businessConnections = loadConnections();
console.log(`📂 Loaded ${businessConnections.size} saved connection(s)`);

// ===================================
// /start — confirm bot is alive
// ===================================
bot.onText(/\/start/, async (msg) => {
  const conn = [...businessConnections.values()].find(c => c.ownerChatId === msg.chat.id);
  await bot.sendMessage(
    msg.chat.id,
    `✅ *Bot Online!*\n\n` +
    `🗑️ កំពុង listen: \`deleted_business_messages\`\n` +
    `📡 Connections: *${businessConnections.size}*\n` +
    `🕐 ${new Date().toLocaleString()}`,
    { parse_mode: "Markdown" }
  );
});

// ===================================
// business_connection — Save owner chat ID
// ===================================
bot.on("business_connection", async (bc) => {
  const { user, user_chat_id, is_enabled, id } = bc;

  if (is_enabled) {
    businessConnections.set(id, {
      ownerChatId: user_chat_id,
      ownerName: user.first_name,
      connectedAt: Date.now(),
    });
    saveConnections(businessConnections);
    console.log(`✅ Connected: ${user.first_name} | bcId: ${id} | ownerChatId: ${user_chat_id}`);
  } else {
    businessConnections.delete(id);
    saveConnections(businessConnections);
    console.log(`❌ Disconnected: ${user.first_name} | bcId: ${id}`);
  }
});

// ===================================
// deleted_business_messages — Notify owner
// ===================================
bot.on("deleted_business_messages", async (update) => {
  const bcId = update.business_connection_id;
  const messageIds = update.message_ids || [];
  const customerChatId = update.chat?.id;
  const conn = businessConnections.get(bcId);

  console.log(`🗑️ Deleted IDs: ${messageIds.join(", ")} | bcId: ${bcId} | customerChatId: ${customerChatId}`);

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

console.log("🤖 Bot started — listening for deleted_business_messages");
