import Link from "next/link";
import { Brain, Zap, Search, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RouteNames } from "@/constants";

export default function Home() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col items-center px-4 py-24 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
        <Brain className="h-8 w-8 text-primary" />
      </div>

      <h1 className="text-4xl font-bold tracking-tight text-foreground">
        Echo
      </h1>
      <p className="mt-3 text-lg text-muted-foreground">
        Remember Less. Think More.
      </p>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Your personal AI second brain — capture knowledge via Telegram, review it on the web.
      </p>

      <Button className="mt-8" asChild>
        <Link href={RouteNames.App}>Open Dashboard</Link>
      </Button>

      <div className="mt-16 grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { icon: MessageCircle, title: "Capture via Telegram", desc: "Send /capture or /quick to your bot anytime" },
          { icon: Search, title: "Search instantly", desc: "Full-text search across all your notes" },
          { icon: Zap, title: "AI-powered (soon)", desc: "Auto-summary and tags with Gemini Flash" },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="rounded-xl border border-border p-5 text-left">
            <Icon className="mb-3 h-5 w-5 text-primary" />
            <p className="font-medium text-foreground">{title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
