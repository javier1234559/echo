"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { knowledgeApi } from "@/feature/knowledge/service/knowledgeApi";
import type { UpdateKnowledgeInput } from "@/feature/knowledge/types";
import { RouteNames } from "@/constants";

export const KNOWLEDGE_KEY_FACTORY = {
  all: ["knowledge"] as const,
  lists: () => [...KNOWLEDGE_KEY_FACTORY.all, "list"] as const,
  page: (page: number, limit: number, tag?: string, domain?: string) =>
    [...KNOWLEDGE_KEY_FACTORY.lists(), "page", page, limit, tag ?? "", domain ?? ""] as const,
  detail: (id: string) => [...KNOWLEDGE_KEY_FACTORY.all, "detail", id] as const,
  search: (q: string) => [...KNOWLEDGE_KEY_FACTORY.all, "search", q] as const,
  tags: () => [...KNOWLEDGE_KEY_FACTORY.all, "tags"] as const,
  domains: () => [...KNOWLEDGE_KEY_FACTORY.all, "domains"] as const,
  related: (id: string, tags: string[]) =>
    [...KNOWLEDGE_KEY_FACTORY.all, "related", id, tags.join(",")] as const,
};

export function useKnowledgePage(page = 1, limit = 12, tag?: string, domain?: string) {
  return useQuery({
    queryKey: KNOWLEDGE_KEY_FACTORY.page(page, limit, tag, domain),
    queryFn: () => knowledgeApi.getPage(page, limit, tag, domain),
    staleTime: 1000 * 30,
  });
}

export function useKnowledgeDomains() {
  return useQuery({
    queryKey: KNOWLEDGE_KEY_FACTORY.domains(),
    queryFn: () => knowledgeApi.getDomains(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useRelatedKnowledge(id: string, tags: string[]) {
  return useQuery({
    queryKey: KNOWLEDGE_KEY_FACTORY.related(id, tags),
    queryFn: () => knowledgeApi.getRelated(id, tags),
    enabled: !!id && tags.length > 0,
    staleTime: 1000 * 60,
  });
}

export function useKnowledgeTags() {
  return useQuery({
    queryKey: KNOWLEDGE_KEY_FACTORY.tags(),
    queryFn: () => knowledgeApi.getTags(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useKnowledgeById(id: string) {
  return useQuery({
    queryKey: KNOWLEDGE_KEY_FACTORY.detail(id),
    queryFn: () => knowledgeApi.getById(id),
    enabled: !!id,
    staleTime: 1000 * 60,
  });
}

export function useSearchKnowledge(query: string) {
  return useQuery({
    queryKey: KNOWLEDGE_KEY_FACTORY.search(query),
    queryFn: () => knowledgeApi.search(query),
    enabled: query.length >= 2,
    staleTime: 1000 * 30,
    placeholderData: (prev) => prev,
  });
}

export function useUpdateKnowledge() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateKnowledgeInput }) =>
      knowledgeApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: KNOWLEDGE_KEY_FACTORY.detail(id) });
      queryClient.invalidateQueries({ queryKey: KNOWLEDGE_KEY_FACTORY.lists() });
    },
  });
}

export function useDeleteKnowledge() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: (id: string) => knowledgeApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KNOWLEDGE_KEY_FACTORY.lists() });
      router.push(RouteNames.App);
    },
  });
}

export function useUpdateReflection(knowledgeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ question, answer }: { question: string; answer: string }) =>
      knowledgeApi.updateReflection(knowledgeId, question, answer),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KNOWLEDGE_KEY_FACTORY.detail(knowledgeId) });
    },
  });
}
