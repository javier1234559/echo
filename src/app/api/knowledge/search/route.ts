import { NextRequest, NextResponse } from "next/server";
import { knowledgeRepository } from "@/feature/knowledge/service/knowledgeRepository";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  if (!q || q.length < 2) return NextResponse.json([]);
  const results = await knowledgeRepository.search(q);
  return NextResponse.json(results);
}
