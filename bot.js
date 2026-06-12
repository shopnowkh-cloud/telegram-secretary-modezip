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
        "business_message",
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
// Message cache — stores full message object
// ===================================
const messageCache = new Map();
const MAX_CACHE = 500;

function cacheMessage(msg) {
  if (messageCache.size >= MAX_CACHE) {
    messageCache.delete(messageCache.keys().next().value);
  }
  messageCache.set(msg.message_id, msg);
  console.log(`💾 Cached msg_id: ${msg.message_id}`);
}

// Resend original message content to owner chat
async function resendOriginal(ownerChatId, msg) {
  const name = msg.from?.first_name || "Customer";
  const header = `🗑️ <b>${name}</b> បានលុបសារ:\n`;
  const opts = { parse_mode: "HTML" };

  if (msg.text) {
    await bot.sendMessage(ownerChatId, header + msg.text, opts);
  } else if (msg.photo) {
    const fileId = msg.photo[msg.photo.length - 1].file_id;
    await bot.sendPhoto(ownerChatId, fileId, { caption: header + (msg.caption || ""), ...opts });
  } else if (msg.video) {
    await bot.sendVideo(ownerChatId, msg.video.file_id, { caption: header + (msg.caption || ""), ...opts });
  } else if (msg.voice) {
    await bot.sendVoice(ownerChatId, msg.voice.file_id, { caption: header, ...opts });
  } else if (msg.video_note) {
    await bot.sendMessage(ownerChatId, header, opts);
    await bot.sendVideoNote(ownerChatId, msg.video_note.file_id);
  } else if (msg.audio) {
    await bot.sendAudio(ownerChatId, msg.audio.file_id, { caption: header + (msg.caption || ""), ...opts });
  } else if (msg.document) {
    await bot.sendDocument(ownerChatId, msg.document.file_id, { caption: header + (msg.caption || ""), ...opts });
  } else if (msg.sticker) {
    await bot.sendMessage(ownerChatId, header, opts);
    await bot.sendSticker(ownerChatId, msg.sticker.file_id);
  } else if (msg.animation) {
    await bot.sendAnimation(ownerChatId, msg.animation.file_id, { caption: header + (msg.caption || ""), ...opts });
  } else if (msg.location) {
    await bot.sendMessage(ownerChatId, header, opts);
    await bot.sendLocation(ownerChatId, msg.location.latitude, msg.location.longitude);
  } else if (msg.contact) {
    await bot.sendMessage(ownerChatId, header, opts);
    await bot.sendContact(ownerChatId, msg.contact.phone_number, msg.contact.first_name);
  } else {
    await bot.sendMessage(ownerChatId, header + "<i>[Unknown type]</i>", opts);
  }
}

// ===================================
// /start — confirm bot is alive
// ===================================
bot.onText(/\/start/, async (msg) => {
  await bot.sendMessage(
    msg.chat.id,
    `✅ <b>Bot Online!</b>\n\n` +
    `🗑️ Listening: deleted_business_messages\n` +
    `📡 Connections: ${businessConnections.size}\n` +
    `🕐 ${new Date().toLocaleString()}`,
    { parse_mode: "HTML" }
  );
});

// ===================================
// business_message — Cache full message
// ===================================
bot.on("business_message", (msg) => {
  cacheMessage(msg);
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
// deleted_business_messages — Resend original to owner
// ===================================
bot.on("deleted_business_messages", async (update) => {
  const bcId = update.business_connection_id;
  const messageIds = update.message_ids || [];
  const customerChatId = update.chat?.id;
  const conn = businessConnections.get(bcId);

  console.log(`🗑️ Deleted IDs: ${messageIds.join(", ")} | customerChatId: ${customerChatId}`);

  if (!conn?.ownerChatId) {
    console.warn(`⚠️ No owner found for bcId: ${bcId}`);
    return;
  }

  for (const id of messageIds) {
    const cached = messageCache.get(id);
    if (cached) {
      await resendOriginal(conn.ownerChatId, cached);
    } else {
      await bot.sendMessage(
        conn.ownerChatId,
        `🗑️ Customer បានលុបសារ\n<i>msg_id ${id} — not cached</i>`,
        { parse_mode: "HTML" }
      );
    }
  }
});

console.log("🤖 Bot started — listening for deleted_business_messages");
