import { NextRequest, NextResponse } from "next/server";
import { knowledgeRepository } from "@/feature/knowledge/service/knowledgeRepository";

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const page = Number(params.get("page") ?? "1");
  const limit = Number(params.get("limit") ?? "12");
  const tag = params.get("tag") ?? undefined;
  const domain = params.get("domain") ?? undefined;

  const { items, total } = await knowledgeRepository.getRecentPaginated(
    Math.max(1, page),
    Math.min(limit, 50),
    tag,
    domain,
  );

  return NextResponse.json({
    items,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}
