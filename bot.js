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
        "edited_business_message",
        "deleted_business_messages",
      ],
    },
  },
});

// Graceful shutdown — prevents 409 Conflict on restart
process.once("SIGINT", () => bot.stopPolling());
process.once("SIGTERM", () => bot.stopPolling());

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

// ===================================
// Edit counter — E1, E2, E3…
// ===================================
let editCounter = 0;

function cacheMessage(msg) {
  if (messageCache.size >= MAX_CACHE) {
    messageCache.delete(messageCache.keys().next().value);
  }
  messageCache.set(msg.message_id, msg);
  console.log(`💾 Cached msg_id: ${msg.message_id}`);
}

// Build display name from a Telegram user/chat object
function buildName(person) {
  const first = person?.first_name || "";
  const last = person?.last_name || "";
  const full = [first, last].filter(Boolean).join(" ") || "Customer";
  const username = person?.username ? ` @${person.username}` : "";
  return { full, username };
}

// Send the cached message content to owner, using the provided header
async function sendCachedContent(ownerChatId, msg, header) {
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
  const name = msg.from?.first_name || "អ្នក";
  await bot.sendMessage(
    msg.chat.id,
    `សូមស្វាគមន៍ ${name}\n\n` +
    `🧑‍🏫 អ្វីដែលអាចធ្វើបាន៖\n` +
    `• ជូនដំណឹងភ្លាមៗពេលដៃគូរបស់អ្នកកែសម្រួល ឬលុបសារ`,
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
// edited_business_message — Notify owner of edit
// ===================================
bot.on("edited_business_message", async (msg) => {
  const bcId = msg.business_connection_id;
  const conn = businessConnections.get(bcId);

  if (!conn?.ownerChatId) {
    console.warn(`⚠️ No owner found for bcId: ${bcId}`);
    return;
  }

  editCounter++;
  const { full, username } = buildName(msg.from);
  const opts = { parse_mode: "HTML" };

  const original = messageCache.get(msg.message_id);
  const originalText = original?.text || original?.caption || "<i>[not cached]</i>";
  const newText = msg.text || msg.caption || "<i>[media]</i>";

  await bot.sendMessage(
    conn.ownerChatId,
    `<b>E${editCounter}. ${full}${username} edited a message:</b>\n` +
    `<s>${originalText}</s>\n` +
    `➡️ ${newText}`,
    opts
  );

  cacheMessage(msg);
  console.log(`✏️ Edit E${editCounter} by ${full} | msg_id: ${msg.message_id}`);
});

// ===================================
// business_connection — Save owner chat ID
// ===================================
bot.on("business_connection", async (bc) => {
  const { user, user_chat_id, is_enabled, id } = bc;
  const { full: ownerName, username: ownerUsername } = buildName(user);

  if (is_enabled) {
    businessConnections.set(id, {
      ownerChatId: user_chat_id,
      ownerUserId: user.id,
      ownerName: user.first_name,
      connectedAt: Date.now(),
    });
    saveConnections(businessConnections);
    console.log(`✅ Connected: ${ownerName} | bcId: ${id} | ownerChatId: ${user_chat_id}`);

    await bot.sendMessage(
      user_chat_id,
      `✅ <b>Bot បានភ្ជាប់ជោគជ័យ!</b>\n\n` +
      `👤 ${ownerName}${ownerUsername}\n` +
      `🕐 ${new Date().toLocaleString("km-KH")}`,
      { parse_mode: "HTML" }
    );
  } else {
    businessConnections.delete(id);
    saveConnections(businessConnections);
    console.log(`❌ Disconnected: ${ownerName} | bcId: ${id}`);

    await bot.sendMessage(
      user_chat_id,
      `❌ <b>Bot បានផ្ដាច់ connection!</b>\n\n` +
      `👤 ${ownerName}${ownerUsername}\n` +
      `🕐 ${new Date().toLocaleString("km-KH")}`,
      { parse_mode: "HTML" }
    );
  }
});

// ===================================
// deleted_business_messages — Resend original to owner
// ===================================
bot.on("deleted_business_messages", async (update) => {
  const bcId = update.business_connection_id;
  const messageIds = update.message_ids || [];
  const conn = businessConnections.get(bcId);

  if (!conn?.ownerChatId) {
    console.warn(`⚠️ No owner found for bcId: ${bcId}`);
    return;
  }

  // Owner's user ID (ownerChatId == user ID for private chats)
  const ownerUserId = conn.ownerUserId || conn.ownerChatId;

  for (const id of messageIds) {
    const cached = messageCache.get(id);

    // Determine who deleted: compare sender ID with owner ID
    let deleterName, deleterUsername;
    if (cached?.from) {
      const isOwner = cached.from.id === ownerUserId;
      if (isOwner) {
        // Owner deleted their own message — use owner info from cache
        ({ full: deleterName, username: deleterUsername } = buildName(cached.from));
      } else {
        // Customer deleted their own message — use customer info from cache
        ({ full: deleterName, username: deleterUsername } = buildName(cached.from));
      }
    } else {
      // Not cached — fall back to update.chat (the peer/customer)
      ({ full: deleterName, username: deleterUsername } = buildName(update.chat));
    }

    console.log(`🗑️ Deleted msg_id: ${id} | by: ${deleterName}${deleterUsername}`);
    const header = `<b>${deleterName}${deleterUsername} deleted a message:</b>\n`;

    if (cached) {
      await sendCachedContent(conn.ownerChatId, cached, header);
    } else {
      await bot.sendMessage(
        conn.ownerChatId,
        `<b>${deleterName}${deleterUsername} deleted a message:</b>\n<i>[not cached]</i>`,
        { parse_mode: "HTML" }
      );
    }
  }
});

console.log("🤖 Bot started — listening for deleted_business_messages");
