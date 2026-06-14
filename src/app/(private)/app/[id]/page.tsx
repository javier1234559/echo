import { KnowledgeDetailView } from "@/feature/knowledge/views/KnowledgeDetailView";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function KnowledgeDetailPage({ params }: Props) {
  const { id } = await params;
  return <KnowledgeDetailView id={id} />;
}
