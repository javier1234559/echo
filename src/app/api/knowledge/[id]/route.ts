import { NextRequest, NextResponse } from "next/server";
import { knowledgeRepository } from "@/feature/knowledge/service/knowledgeRepository";
import type { UpdateKnowledgeInput } from "@/feature/knowledge/types";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const item = await knowledgeRepository.getById(id);
  if (!item) return NextResponse.json({ message: "Not found" }, { status: 404 });
  return NextResponse.json(item);
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const body = (await req.json()) as UpdateKnowledgeInput;
  const updated = await knowledgeRepository.update(id, body);
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  await knowledgeRepository.delete(id);
  return NextResponse.json({ ok: true });
}
