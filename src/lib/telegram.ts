import { telegramConfig } from "@/config";

const BASE_URL = `https://api.telegram.org/bot${telegramConfig.BOT_TOKEN}`;

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TelegramChat {
  id: number;
  type: string;
  first_name?: string;
  username?: string;
}

export interface TelegramMessage {
  message_id: number;
  chat: TelegramChat;
  text?: string;
  date: number;
}

export interface TelegramCallbackQuery {
  id: string;
  from: { id: number };
  message?: TelegramMessage;
  data?: string;
}

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
}

export interface InlineButton {
  text: string;
  callback_data?: string;
  url?: string;
}

// ─── Core ────────────────────────────────────────────────────────────────────

async function callApi(method: string, body: Record<string, unknown>) {
  const res = await fetch(`${BASE_URL}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Telegram API error [${method}]: ${err}`);
  }
  return res.json();
}

export function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ─── Messaging ───────────────────────────────────────────────────────────────

export async function sendMessage(chatId: number, text: string) {
  return callApi("sendMessage", { chat_id: chatId, text, parse_mode: "HTML" });
}

export async function sendMessageWithButtons(
  chatId: number,
  text: string,
  keyboard: InlineButton[][],
): Promise<{ message_id: number }> {
  const res = await callApi("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    reply_markup: { inline_keyboard: keyboard },
  });
  return res.result ?? res;
}

export async function editMessage(
  chatId: number,
  messageId: number,
  text: string,
  keyboard?: InlineButton[][],
) {
  return callApi("editMessageText", {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: "HTML",
    reply_markup: keyboard ? { inline_keyboard: keyboard } : { inline_keyboard: [] },
  });
}

export async function answerCallbackQuery(callbackQueryId: string, text?: string) {
  return callApi("answerCallbackQuery", {
    callback_query_id: callbackQueryId,
    text,
    show_alert: false,
  });
}

// ─── Setup ───────────────────────────────────────────────────────────────────

export async function setWebhook(webhookUrl: string) {
  return callApi("setWebhook", {
    url: webhookUrl,
    secret_token: telegramConfig.WEBHOOK_SECRET,
    allowed_updates: ["message", "callback_query"],
  });
}

export async function setMyCommands() {
  return callApi("setMyCommands", {
    commands: [
      { command: "capture", description: "Capture with AI — text or URL" },
      { command: "quick", description: "Quick save, no AI processing" },
      { command: "search", description: "Search notes by keyword" },
      { command: "recall", description: "Ask AI to find knowledge naturally" },
      { command: "recent", description: "See 5 latest notes" },
      { command: "help", description: "Show all commands" },
    ],
  });
}

export async function getWebhookInfo() {
  const res = await fetch(`${BASE_URL}/getWebhookInfo`);
  return res.json();
}
