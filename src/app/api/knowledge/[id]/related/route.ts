import { NextRequest, NextResponse } from "next/server";
import { knowledgeRepository } from "@/feature/knowledge/service/knowledgeRepository";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const tags = req.nextUrl.searchParams.getAll("tag");
  const related = await knowledgeRepository.getRelated(id, tags, 4);
  return NextResponse.json(related);
}
