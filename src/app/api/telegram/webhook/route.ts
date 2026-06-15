import { NextRequest, NextResponse } from "next/server";
import { telegramConfig, globalConfig } from "@/config";
import {
  sendMessage,
  sendMessageWithButtons,
  editMessage,
  answerCallbackQuery,
  escapeHtml,
  type TelegramUpdate,
  type InlineButton,
} from "@/lib/telegram";
import { knowledgeRepository } from "@/feature/knowledge/service/knowledgeRepository";
import { generateCapture, chatAboutCapture, recallKnowledge, extractSearchKeywords } from "@/lib/ai";
import { captureState } from "@/lib/captureState";
import type { PendingCapture } from "@/lib/captureState";
import type { SourceType } from "@/feature/knowledge/types";
import { REFLECTION_PROMPTS } from "@/feature/knowledge/types";

const REFLECTION_SECTIONS = ["Why it matters to me", "Possible use cases", "Notes"];

// ─── Auth ─────────────────────────────────────────────────────────────────────

function isValidSecret(req: NextRequest): boolean {
  if (!telegramConfig.WEBHOOK_SECRET) return true;
  return req.headers.get("x-telegram-bot-api-secret-token") === telegramConfig.WEBHOOK_SECRET;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function webLink(id: string): string {
  return `${globalConfig.APP_URL}/app/${id}`;
}

// Telegram rejects localhost URLs in URL buttons → only use buttons with real public URLs
const isLocalhost = globalConfig.APP_URL.startsWith("http://localhost") ||
  globalConfig.APP_URL.startsWith("http://127.");

function formatKnowledgeList(
  items: { title: string; id: string; created_at: string }[],
): string {
  if (!items.length) return "Nothing here yet.";
  return items
    .map((k) => {
      const date = new Date(k.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      // On localhost, show URL as plain text since buttons and <a href> both fail
      const linkLine = isLocalhost ? `\n  <code>${webLink(k.id)}</code>` : "";
      return `▸ <b>${escapeHtml(k.title)}</b>  <i>${date}</i>${linkLine}`;
    })
    .join("\n\n");
}

function knowledgeButtons(
  items: { title: string; id: string }[],
): InlineButton[][] {
  if (isLocalhost) return [];
  return items.map((k) => [
    { text: `📖 ${k.title.slice(0, 40)}`, url: webLink(k.id) },
  ]);
}

async function sendWithOptionalButtons(
  chatId: number,
  text: string,
  buttons: InlineButton[][],
) {
  if (buttons.length === 0) {
    await sendMessage(chatId, text);
  } else {
    await sendMessageWithButtons(chatId, text, buttons);
  }
}

function buildCapturePreview(capture: {
  title: string;
  contentType: string;
  domain: string;
  tldr: string[];
  tags: string[];
  sourceType: SourceType;
  sourceUrl?: string;
}): string {
  const date = new Date().toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
  const tagLine = capture.tags.length
    ? capture.tags.map((t) => `#${t}`).join(" ")
    : "—";
  const tldrLine = capture.tldr.length
    ? capture.tldr.map((b) => `• ${escapeHtml(b)}`).join("\n")
    : "—";

  const typeIcon = capture.contentType === "resource" ? "🔧" : "📚";

  return (
    `${typeIcon} <b>${escapeHtml(capture.title)}</b>\n` +
    `<i>${capture.contentType} · ${capture.domain}</i>\n\n` +
    `🏷 ${tagLine}\n` +
    `📅 ${date}\n\n` +
    `<b>TL;DR</b>\n${tldrLine}`
  );
}

const CAPTURE_BUTTONS = (id: string) => [
  [
    { text: "✅ Approve", callback_data: `approve:${id}` },
    { text: "❌ Reject", callback_data: `reject:${id}` },
  ],
  [{ text: "💬 Ask AI", callback_data: `ask:${id}` }],
];

// ─── Command handlers ─────────────────────────────────────────────────────────

async function handleCapture(args: string, chatId: number) {
  if (!args) {
    await sendMessage(chatId, "Usage: /capture &lt;text or URL&gt;");
    return;
  }

  await sendMessage(chatId, "🧠 Processing...");

  const isUrl = args.startsWith("http://") || args.startsWith("https://");
  const sourceType: SourceType = isUrl ? "url" : "text";

  let title = args.split("\n")[0].slice(0, 60);
  let tldr: string[] = [];
  let tags: string[] = [];
  let contentType: import("@/feature/knowledge/types").ContentType = "knowledge";
  let domain: import("@/feature/knowledge/types").Domain = "Other";

  try {
    const ai = await generateCapture(args);
    title = ai.title;
    tldr = ai.tldr;
    tags = ai.tags;
    contentType = ai.content_type;
    domain = ai.domain;
  } catch {
    // AI failed — proceed with fallback
  }

  const pending = captureState.create({
    chatId,
    content: args,
    title,
    tldr,
    tags,
    sourceType,
    sourceUrl: isUrl ? args : undefined,
    contentType,
    domain,
  });

  const preview = buildCapturePreview({
    title,
    contentType,
    domain,
    tldr,
    tags,
    sourceType,
    sourceUrl: isUrl ? args : undefined,
  });

  const sent = await sendMessageWithButtons(chatId, preview, CAPTURE_BUTTONS(pending.id));
  // Store message_id so we can edit it later when buttons are clicked
  if (sent?.message_id) {
    captureState.update(pending.id, { history: [] }); // keep reference alive
    // attach messageId via update
    const c = captureState.get(pending.id);
    if (c) captureState.update(pending.id, { ...c, history: [] });
    // store messageId in a simple way
    (pending as { messageId?: number }).messageId = sent.message_id;
    captureState.update(pending.id, pending);
  }
}

async function handleQuick(args: string, chatId: number) {
  if (!args) {
    await sendMessage(chatId, "Usage: /quick &lt;text&gt;");
    return;
  }
  const title = args.split("\n")[0].slice(0, 60);
  const knowledge = await knowledgeRepository.create({
    title,
    raw_content: args,
    source_type: "text",
    status: "quick",
  });
  await sendWithOptionalButtons(
    chatId,
    `⚡ <b>Saved</b>\n\n${escapeHtml(knowledge.title)}`,
    [[{ text: "📖 Xem note", url: webLink(knowledge.id) }]],
  );
}

async function handleSearch(args: string, chatId: number) {
  if (!args) {
    await sendMessage(chatId, "Usage: /search &lt;keyword&gt;");
    return;
  }
  const results = await knowledgeRepository.search(args);
  if (!results.length) {
    await sendMessage(chatId, `🔍 <b>No results for "${escapeHtml(args)}"</b>`);
    return;
  }
  const header = `🔍 <b>${results.length} result${results.length !== 1 ? "s" : ""} for "${escapeHtml(args)}"</b>\n\n${formatKnowledgeList(results)}`;
  await sendWithOptionalButtons(chatId, header, knowledgeButtons(results));
}

async function handleRecall(args: string, chatId: number) {
  if (!args) {
    await sendMessage(chatId, "Usage: /recall &lt;what do you want to know?&gt;");
    return;
  }
  await sendMessage(chatId, "🧠 Searching your brain...");
  const keywords = await extractSearchKeywords(args);
  const notes = await knowledgeRepository.search(keywords);
  const answer = await recallKnowledge(args, notes);

  const sources = notes.slice(0, 4);
  const sourcesText = sources.length
    ? "\n\n<b>Sources:</b>\n" + sources.map((n) => `▸ ${escapeHtml(n.title)}`).join("\n")
    : "";

  const msg = `🧠 <b>Recall: ${escapeHtml(args)}</b>\n\n${escapeHtml(answer)}${sourcesText}`;
  await sendWithOptionalButtons(chatId, msg, knowledgeButtons(sources));
}

async function handleRecent(chatId: number) {
  const items = await knowledgeRepository.getRecent(5);
  if (!items.length) {
    await sendMessage(chatId, "🕐 <b>Recent</b>\n\nNo notes yet.");
    return;
  }
  const header = `🕐 <b>Recent (${items.length})</b>\n\n${formatKnowledgeList(items)}`;
  await sendMessageWithButtons(chatId, header, knowledgeButtons(items));
}

async function handleHelp(chatId: number) {
  await sendMessage(
    chatId,
    "🧠 <b>Echo — Second Brain</b>\n\n" +
      "<b>Capture</b>\n" +
      "/capture &lt;text or URL&gt; — AI summary + approve flow\n" +
      "/quick &lt;text&gt; — instant save, no AI\n\n" +
      "<b>Find</b>\n" +
      "/search &lt;keyword&gt; — search by keyword\n" +
      "/recall &lt;question&gt; — ask AI to find knowledge\n" +
      "/recent — 5 latest notes\n\n" +
      "<b>Other</b>\n" +
      "/ping — check status\n" +
      "/help — this menu",
  );
}

// ─── Callback handlers ────────────────────────────────────────────────────────

async function handleApprove(captureId: string, chatId: number, callbackId: string, msgId?: number) {
  const pending = captureState.get(captureId);
  if (!pending) {
    if (callbackId) await answerCallbackQuery(callbackId, "Session expired. Use /capture again.");
    else await sendMessage(chatId, "No pending capture. Use /capture first.");
    return;
  }

  if (callbackId) await answerCallbackQuery(callbackId, "Saving...");

  const knowledge = await knowledgeRepository.createWithReflections({
    title: pending.title,
    raw_content: pending.content,
    summary: pending.tldr.join("\n"),
    source_type: pending.sourceType,
    source_url: pending.sourceUrl,
    content_type: pending.contentType,
    domain: pending.domain,
    tags: pending.tags,
  });

  // Transition to reflection mode instead of deleting
  captureState.update(captureId, {
    knowledgeId: knowledge.id,
    reflectionStep: 0,
    inAskMode: false,
  });

  const link = webLink(knowledge.id);

  if (msgId) {
    const keyboard = isLocalhost ? [] : [[{ text: "📖 Xem note", url: link }]];
    await editMessage(chatId, msgId, `✅ <b>Saved!</b>`, keyboard);
  }

  // Ask first user section question
  const firstSection = REFLECTION_SECTIONS[0];
  await sendMessage(
    chatId,
    `✍️ <b>Ghi chú cá nhân</b> (1/3)\n\n` +
      `<b>${firstSection}</b>\n${escapeHtml(REFLECTION_PROMPTS[firstSection])}\n\n` +
      `Gõ câu trả lời • /skip bỏ qua • /done kết thúc`,
  );
}

async function handleReflectionAnswer(text: string, chatId: number, pending: PendingCapture) {
  const step = pending.reflectionStep!;
  const section = REFLECTION_SECTIONS[step];

  await knowledgeRepository.updateReflectionByQuestion(pending.knowledgeId!, section, text);

  const nextStep = step + 1;

  if (nextStep >= REFLECTION_SECTIONS.length) {
    const noteId = pending.knowledgeId!;
    captureState.delete(pending.id);
    await sendWithOptionalButtons(
      chatId,
      `✅ <b>Hoàn tất! Đã lưu tất cả suy ngẫm.</b>`,
      [[{ text: "📖 Xem note", url: webLink(noteId) }]],
    );
  } else {
    captureState.update(pending.id, { reflectionStep: nextStep });
    const nextSection = REFLECTION_SECTIONS[nextStep];
    await sendMessage(
      chatId,
      `✍️ <b>${nextSection}</b> (${nextStep + 1}/3)\n\n${escapeHtml(REFLECTION_PROMPTS[nextSection])}\n\n` +
        `/skip bỏ qua • /done kết thúc`,
    );
  }
}

async function handleReflectionSkip(chatId: number) {
  const pending = captureState.getByChat(chatId);
  if (!pending || pending.reflectionStep === undefined) {
    await sendMessage(chatId, "Không có câu hỏi đang chờ.");
    return;
  }

  const nextStep = pending.reflectionStep + 1;

  if (nextStep >= REFLECTION_SECTIONS.length) {
    const noteId = pending.knowledgeId!;
    captureState.delete(pending.id);
    await sendWithOptionalButtons(
      chatId,
      `✅ <b>Xong!</b>`,
      [[{ text: "📖 Xem note", url: webLink(noteId) }]],
    );
  } else {
    captureState.update(pending.id, { reflectionStep: nextStep });
    const nextSection = REFLECTION_SECTIONS[nextStep];
    await sendMessage(
      chatId,
      `⏭ <b>${nextSection}</b> (${nextStep + 1}/3)\n\n${escapeHtml(REFLECTION_PROMPTS[nextSection])}\n\n` +
        `/skip bỏ qua • /done kết thúc`,
    );
  }
}

async function handleReflectionDone(chatId: number) {
  const pending = captureState.getByChat(chatId);
  if (!pending || pending.reflectionStep === undefined) return;
  const noteId = pending.knowledgeId!;
  captureState.delete(pending.id);
  await sendWithOptionalButtons(
    chatId,
    `✅ <b>Đã lưu!</b>`,
    [[{ text: "📖 Xem note", url: webLink(noteId) }]],
  );
}

async function handleReject(captureId: string, chatId: number, callbackId: string, msgId?: number) {
  captureState.delete(captureId);
  if (callbackId) await answerCallbackQuery(callbackId, "Discarded.");
  if (msgId) {
    await editMessage(chatId, msgId, "❌ <b>Discarded</b>\n\nCapture deleted.");
  } else {
    await sendMessage(chatId, "❌ Discarded.");
  }
}

async function handleAsk(captureId: string, chatId: number, callbackId: string, msgId?: number) {
  const pending = captureState.get(captureId);
  if (!pending) {
    await answerCallbackQuery(callbackId, "Session expired. Use /capture again.");
    return;
  }

  captureState.update(captureId, { inAskMode: true });
  await answerCallbackQuery(callbackId);

  if (msgId) {
    await editMessage(
      chatId,
      msgId,
      buildCapturePreview({
        title: pending.title,
        contentType: pending.contentType,
        domain: pending.domain,
        tldr: pending.tldr,
        tags: pending.tags,
        sourceType: pending.sourceType,
        sourceUrl: pending.sourceUrl,
      }) + "\n\n<i>💬 Ask mode active</i>",
    );
  }

  await sendMessage(
    chatId,
    "💬 <b>Ask mode</b>\n\n" +
      "I have full context of this capture. Ask me anything to think it through.\n\n" +
      "When ready:\n" +
      "/approve — save it\n" +
      "/discard — throw it away",
  );
}

// ─── Free text handler ────────────────────────────────────────────────────────

async function handleFreeText(text: string, chatId: number) {
  const pending = captureState.getByChat(chatId);
  if (!pending) {
    await sendMessage(chatId, "Use /help to see available commands.");
    return;
  }

  // Reflection mode takes priority over ask mode
  if (pending.reflectionStep !== undefined) {
    await handleReflectionAnswer(text, chatId, pending);
    return;
  }

  if (pending.inAskMode) {
    const reply = await chatAboutCapture(pending.content, text, pending.history);
    captureState.update(pending.id, {
      history: [
        ...pending.history,
        { role: "user", content: text },
        { role: "assistant", content: reply },
      ],
    });
    await sendMessage(chatId, escapeHtml(reply));
    return;
  }

  await sendMessage(chatId, "Use /help to see available commands.");
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!isValidSecret(req)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  try {
    const update: TelegramUpdate = await req.json();

    // Callback query (button clicks)
    if (update.callback_query) {
      const cq = update.callback_query;
      const chatId = cq.message?.chat.id ?? cq.from.id;
      const msgId = cq.message?.message_id;
      const data = cq.data ?? "";
      const [action, captureId] = data.split(":");

      if (action === "approve") await handleApprove(captureId, chatId, cq.id, msgId);
      else if (action === "reject") await handleReject(captureId, chatId, cq.id, msgId);
      else if (action === "ask") await handleAsk(captureId, chatId, cq.id, msgId);

      return NextResponse.json({ ok: true });
    }

    // Regular messages
    if (update.message?.text && update.message.chat?.id) {
      const text = update.message.text.trim();
      const chatId = update.message.chat.id;
      const spaceIdx = text.indexOf(" ");
      const command = (spaceIdx === -1 ? text : text.slice(0, spaceIdx)).split("@")[0];
      const args = spaceIdx === -1 ? "" : text.slice(spaceIdx + 1).trim();

      if (!command.startsWith("/")) {
        await handleFreeText(text, chatId);
        return NextResponse.json({ ok: true });
      }

      // Ask-mode shortcuts
      if (command === "/approve") {
        const pending = captureState.getByChat(chatId);
        if (pending) {
          await handleApprove(pending.id, chatId, "", undefined);
        } else {
          await sendMessage(chatId, "No pending capture. Use /capture first.");
        }
        return NextResponse.json({ ok: true });
      }

      if (command === "/discard") {
        const pending = captureState.getByChat(chatId);
        if (pending) {
          captureState.delete(pending.id);
          await sendMessage(chatId, "❌ Discarded.");
        } else {
          await sendMessage(chatId, "No pending capture.");
        }
        return NextResponse.json({ ok: true });
      }

      if (command === "/skip") {
        await handleReflectionSkip(chatId);
        return NextResponse.json({ ok: true });
      }

      if (command === "/done") {
        await handleReflectionDone(chatId);
        return NextResponse.json({ ok: true });
      }

      switch (command) {
        case "/ping":
          await sendMessage(chatId, "🏓 pong");
          break;
        case "/capture":
          await handleCapture(args, chatId);
          break;
        case "/quick":
          await handleQuick(args, chatId);
          break;
        case "/search":
          await handleSearch(args, chatId);
          break;
        case "/recall":
          await handleRecall(args, chatId);
          break;
        case "/recent":
          await handleRecent(chatId);
          break;
        case "/start":
        case "/help":
          await handleHelp(chatId);
          break;
        default:
          await sendMessage(chatId, `Unknown command. Send /help to see what's available.`);
      }
    }
  } catch (err) {
    console.error("Telegram webhook error:", err);
  }

  return NextResponse.json({ ok: true });
}
