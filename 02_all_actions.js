// ===================================
// Secretary Mode - All Chat Actions
// ===================================

const TelegramBot = require("node-telegram-bot-api");
const TOKEN = "YOUR_BOT_TOKEN_HERE";
const bot = new TelegramBot(TOKEN, { polling: true });

// Chat Action Types ទាំងអស់
const ACTIONS = {
  typing: "typing",                         // វាយអក្សរ
  upload_photo: "upload_photo",             // upload រូបភាព
  record_video: "record_video",             // ថតវីដេអូ
  upload_video: "upload_video",             // upload វីដេអូ
  record_voice: "record_voice",             // ថតសំឡេង
  upload_voice: "upload_voice",             // upload សំឡេង
  upload_document: "upload_document",       // upload ឯកសារ
  choose_sticker: "choose_sticker",         // ជ្រើសរើស sticker
  find_location: "find_location",           // ស្វែងរក location
  record_video_note: "record_video_note",   // ថត video note
  upload_video_note: "upload_video_note",   // upload video note
};

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text || "";

  if (text.includes("រូបភាព") || text.includes("photo")) {
    await bot.sendChatAction(chatId, ACTIONS.upload_photo);
    await new Promise((r) => setTimeout(r, 2000));
    await bot.sendMessage(chatId, "📷 កំពុង upload រូបភាព...");

  } else if (text.includes("ឯកសារ") || text.includes("file")) {
    await bot.sendChatAction(chatId, ACTIONS.upload_document);
    await new Promise((r) => setTimeout(r, 2000));
    await bot.sendMessage(chatId, "📄 កំពុង upload ឯកសារ...");

  } else if (text.includes("location") || text.includes("ទីតាំង")) {
    await bot.sendChatAction(chatId, ACTIONS.find_location);
    await new Promise((r) => setTimeout(r, 2000));
    await bot.sendMessage(chatId, "📍 កំពុងស្វែងរកទីតាំង...");

  } else {
    // Default: typing
    await bot.sendChatAction(chatId, ACTIONS.typing);
    await new Promise((r) => setTimeout(r, 1000));
    await bot.sendMessage(chatId, `អ្នកបាននិយាយថា: "${text}"`);
  }
});
