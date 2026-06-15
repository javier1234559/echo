import { NextResponse } from "next/server";
import { knowledgeRepository } from "@/feature/knowledge/service/knowledgeRepository";

export async function GET() {
  const domains = await knowledgeRepository.getDomains();
  return NextResponse.json(domains);
}
