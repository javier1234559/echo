import { NextResponse } from "next/server";
import { knowledgeRepository } from "@/feature/knowledge/service/knowledgeRepository";

export async function GET() {
  const tags = await knowledgeRepository.getAllTags();
  return NextResponse.json(tags);
}
