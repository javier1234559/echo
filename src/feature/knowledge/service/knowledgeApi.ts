import axiosInstance from "@/service/baseApi";
import { handleApiError } from "@/lib/handleApiError";
import type { Knowledge, UpdateKnowledgeInput } from "@/feature/knowledge/types";

export interface KnowledgePage {
  items: Knowledge[];
  total: number;
  page: number;
  totalPages: number;
}

export const knowledgeApi = {
  getPage(page = 1, limit = 12, tag?: string) {
    return axiosInstance
      .get<KnowledgePage>("/api/knowledge", {
        params: { page, limit, ...(tag ? { tag } : {}) },
      })
      .then((r) => r.data)
      .catch(handleApiError);
  },
  getById(id: string) {
    return axiosInstance
      .get<Knowledge>(`/api/knowledge/${id}`)
      .then((r) => r.data)
      .catch(handleApiError);
  },
  search(query: string) {
    return axiosInstance
      .get<Knowledge[]>("/api/knowledge/search", { params: { q: query } })
      .then((r) => r.data)
      .catch(handleApiError);
  },
  getTags() {
    return axiosInstance
      .get<{ tag: string; count: number }[]>("/api/knowledge/tags")
      .then((r) => r.data)
      .catch(handleApiError);
  },
  update(id: string, data: UpdateKnowledgeInput) {
    return axiosInstance
      .put<Knowledge>(`/api/knowledge/${id}`, data)
      .then((r) => r.data)
      .catch(handleApiError);
  },
  updateReflection(knowledgeId: string, question: string, answer: string) {
    return axiosInstance
      .patch(`/api/knowledge/${knowledgeId}/reflection`, { question, answer })
      .then((r) => r.data)
      .catch(handleApiError);
  },
  delete(id: string) {
    return axiosInstance
      .delete(`/api/knowledge/${id}`)
      .then((r) => r.data)
      .catch(handleApiError);
  },
};
