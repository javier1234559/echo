import { NextRequest, NextResponse } from "next/server";
import { globalConfig, telegramConfig } from "@/config";
import { setWebhook, getWebhookInfo, setMyCommands } from "@/lib/telegram";

export async function GET(req: NextRequest) {
  if (!telegramConfig.BOT_TOKEN) {
    return NextResponse.json({ error: "TELEGRAM_BOT_TOKEN is not set" }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action") ?? "register";

  if (action === "info") {
    const info = await getWebhookInfo();
    return NextResponse.json(info);
  }

  const appUrl = searchParams.get("url") ?? globalConfig.APP_URL;
  const webhookUrl = `${appUrl}/api/telegram/webhook`;

  const [webhookResult, commandsResult] = await Promise.all([
    setWebhook(webhookUrl),
    setMyCommands(),
  ]);

  return NextResponse.json({ webhookUrl, webhookResult, commandsResult });
}
