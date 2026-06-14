"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { Moon, Sun, Brain } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { RouteNames } from "@/constants";

export function Header() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
        <Link
          href={RouteNames.App}
          className="flex items-center gap-2 font-semibold text-foreground"
        >
          <Brain className="h-5 w-5 text-primary" />
          <span className="text-base tracking-tight">Echo</span>
        </Link>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          aria-label="Toggle theme"
        >
          {mounted ? (
            resolvedTheme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )
          ) : (
            <span className="h-4 w-4" aria-hidden />
          )}
        </Button>
      </div>
    </header>
  );
}
