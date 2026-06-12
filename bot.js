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
// Deletion counter — K1a, K1b, K2a…
// ===================================
let deletionCounter = 0;

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

// Resend original message content to owner chat
async function resendOriginal(ownerChatId, msg, label) {
  const firstName = msg.from?.first_name || "";
  const lastName = msg.from?.last_name || "";
  const fullName = [firstName, lastName].filter(Boolean).join(" ") || "Customer";
  const username = msg.from?.username ? ` @${msg.from.username}` : "";
  const header = `<b>${label}. ${fullName}${username} deleted a message:</b>\n`;
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
  const label = `E${editCounter}`;
  const firstName = msg.from?.first_name || "";
  const lastName = msg.from?.last_name || "";
  const fullName = [firstName, lastName].filter(Boolean).join(" ") || "Customer";
  const username = msg.from?.username ? ` @${msg.from.username}` : "";
  const opts = { parse_mode: "HTML" };

  const original = messageCache.get(msg.message_id);
  const originalText = original?.text || original?.caption || "<i>[not cached]</i>";
  const newText = msg.text || msg.caption || "<i>[media]</i>";

  await bot.sendMessage(
    conn.ownerChatId,
    `<b>${label}. ${fullName}${username} edited a message:</b>\n` +
    `<s>${originalText}</s>\n` +
    `➡️ ${newText}`,
    opts
  );

  // Update cache with the new version
  cacheMessage(msg);
  console.log(`✏️ Edit E${editCounter} by ${fullName} | msg_id: ${msg.message_id}`);
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
  const conn = businessConnections.get(bcId);

  // Build name from update.chat (always present in deletion event)
  const chat = update.chat || {};
  const chatFirstName = chat.first_name || "";
  const chatLastName = chat.last_name || "";
  const chatFullName = [chatFirstName, chatLastName].filter(Boolean).join(" ") || "Customer";
  const chatUsername = chat.username ? ` @${chat.username}` : "";

  console.log(`🗑️ Deleted IDs: ${messageIds.join(", ")} | by: ${chatFullName}${chatUsername}`);

  if (!conn?.ownerChatId) {
    console.warn(`⚠️ No owner found for bcId: ${bcId}`);
    return;
  }

  deletionCounter++;
  for (let i = 0; i < messageIds.length; i++) {
    const id = messageIds[i];
    const letter = String.fromCharCode(97 + i); // a, b, c…
    const label = `K${deletionCounter}${letter}`;
    const cached = messageCache.get(id);
    if (cached) {
      // Use cached msg.from for name (most accurate — the actual sender)
      const fromFirst = cached.from?.first_name || chatFirstName;
      const fromLast = cached.from?.last_name || chatLastName;
      const fromName = [fromFirst, fromLast].filter(Boolean).join(" ") || "Customer";
      const fromUsername = cached.from?.username
        ? ` @${cached.from.username}`
        : chatUsername;
      // Temporarily patch cached.from so resendOriginal picks up the right name
      const patchedMsg = {
        ...cached,
        from: {
          ...cached.from,
          first_name: fromFirst,
          last_name: fromLast,
          username: cached.from?.username || chat.username,
        },
      };
      await resendOriginal(conn.ownerChatId, patchedMsg, label);
    } else {
      await bot.sendMessage(
        conn.ownerChatId,
        `<b>${label}. ${chatFullName}${chatUsername} deleted a message:</b>\n<i>[not cached]</i>`,
        { parse_mode: "HTML" }
      );
    }
  }
});

console.log("🤖 Bot started — listening for deleted_business_messages");
