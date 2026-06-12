# 📁 Telegram Bot - Secretary Mode + Business Chat Automation

## 📂 Files

| File | មាតិកា |
|------|--------|
| `01_basic.js` | Typing action សាមញ្ញ |
| `02_all_actions.js` | Chat Actions ទាំងអស់ |
| `03_long_task.js` | Loop action សម្រាប់ task យូរ |
| `04_secretary_bot_full.js` | Secretary Bot ពេញលេញ |
| `05_business_chat_automation.js` | Business Chat Automation |
| `06_business_setup_guide.js` | Business Bot + Auto-Reply ពេញលេញ |

---

## 🚀 Secretary Mode (sendChatAction)

```js
await bot.sendChatAction(chatId, "typing");
await delay(1500);
await bot.sendMessage(chatId, "Hello!");
```

### Chat Actions
| Action | ន័យ |
|--------|-----|
| `typing` | កំពុងវាយអក្សរ |
| `upload_photo` | upload រូបភាព |
| `upload_document` | upload ឯកសារ |
| `record_voice` | ថតសំឡេង |
| `find_location` | ស្វែងរក location |

> ⚠️ Action ផុតអស់ក្នុង **5 វិនាទី** — loop វារៀងរាល់ 4 វិនាទី!

---

## 💼 Business Chat Automation (Files 05 & 06)

### តម្រូវការ
1. **Telegram Premium** ឬ **Telegram Business** account
2. Enable bot ក្នុង BotFather:
   ```
   /mybots > [your bot] > Bot Settings > Allow in Business
   ```
3. Enable `business_connection` ក្នុង allowed_updates

### Events ថ្មី
| Event | ន័យ |
|-------|-----|
| `business_connection` | User Add/Remove bot ពី Business |
| `business_message` | Message ពី Business chat |
| `edited_business_message` | Message ដែលបានកែប្រែ |
| `deleted_business_messages` | Messages ដែលបានលុប |

### របៀប Add Bot ទៅ Telegram Business

```
1. Telegram Settings
2. Telegram Business
3. Chatbots
4. Add your bot username
5. Enable "Reply to messages"
```

### Owner Commands
| Command | មុខងារ |
|---------|--------|
| `/status` | មើលស្ថានភាព bot |
| `/pause` | ផ្អាក auto-reply |
| `/resume` | បើក auto-reply |

---

## ⚙️ Setup

```bash
npm install
# ដាក់ token ក្នុងគ្រប់ files
npm start
```
