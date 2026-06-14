export const globalConfig = {
  API_URL: process.env.NEXT_PUBLIC_APP_API,
  APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
  APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  MOCK_EMAIL: process.env.NEXT_PUBLIC_MOCK_EMAIL ?? "user@gmail.com",
  MOCK_PASSWORD: process.env.NEXT_PUBLIC_MOCK_PASSWORD ?? "123456",
};

export const telegramConfig = {
  BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN ?? "",
  WEBHOOK_SECRET: process.env.TELEGRAM_WEBHOOK_SECRET ?? "",
};

export const supabaseConfig = {
  URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
};

export const aiConfig = {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? "",
  MODEL: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
};

export const brandConfig = {
  NAME: "Echo",
  DESCRIPTION: "Echo — Remember Less. Think More. Your personal AI second brain.",
  VERSION: "0.1.0",
  AUTHOR: "Echo",
  AUTHOR_EMAIL: "",
  AUTHOR_URL: "",
};
