import { NextRequest, NextResponse } from "next/server";
import { knowledgeRepository } from "@/feature/knowledge/service/knowledgeRepository";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const { question, answer } = (await req.json()) as { question: string; answer: string };

  if (!question || !answer) {
    return NextResponse.json({ message: "question and answer required" }, { status: 400 });
  }

  await knowledgeRepository.updateReflectionByQuestion(id, question, answer);
  return NextResponse.json({ ok: true });
}
