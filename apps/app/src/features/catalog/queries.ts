import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

/**
 * Müfredat (catalog.service). İkon ve zayıf bayrağı sunucudan; önbellek süreleri Flutter ile
 * aynı (modül/ders 5 dk, konu/atlas 1 dk). Premium kilidi istemcide uygulanmaz; yalnız rozet.
 */
export interface CatalogModule {
  id: string;
  key: string;
  name: string;
  description: string | null;
  icon: string | null;
  questionCount: number;
  solvedCount: number;
  /** 0-100; hiç çözüm yoksa null. */
  accuracy: number | null;
  isPreferred: boolean;
}

export interface CatalogCourse {
  id: string;
  name: string;
  icon: string | null;
  sectionName: string;
  weightPercent: number;
}

export interface CatalogTopic {
  id: string;
  name: string;
  solvedCount: number;
  /** 0-100; çözüm yoksa null. */
  mastery: number | null;
  weak: boolean;
  isPremium: boolean;
  isLaw: boolean;
  lawSlug: string | null;
  children: CatalogTopic[];
}

export interface CourseTopics {
  topics: CatalogTopic[];
  summary: { solvedCount: number; mastery: number | null; unresolvedWrongCount: number };
}

export interface TopicAtlas {
  topicId: string;
  topicName: string;
  articles: { no: string; questionCount: number; clearedCount: number; conquered: boolean }[];
  conqueredCount: number;
}

export const catalogKeys = {
  modules: ["catalog", "modules"] as const,
  courses: (moduleId: string | null | undefined) => ["catalog", "courses", moduleId] as const,
  topics: (courseId: string | null) => ["catalog", "topics", courseId] as const,
  atlas: (topicId: string | null) => ["catalog", "atlas", topicId] as const,
};

export function useModules() {
  return useQuery({ queryKey: catalogKeys.modules, queryFn: () => api<CatalogModule[]>("/catalog/modules"), staleTime: 5 * 60_000 });
}

export function useCourses(moduleId: string | null | undefined) {
  return useQuery({
    queryKey: catalogKeys.courses(moduleId),
    queryFn: () => api<CatalogCourse[]>(`/catalog/modules/${moduleId}/courses`),
    enabled: Boolean(moduleId),
    staleTime: 5 * 60_000,
  });
}

export function useCourseTopics(courseId: string | null) {
  return useQuery({
    queryKey: catalogKeys.topics(courseId),
    queryFn: () => api<CourseTopics>(`/catalog/courses/${courseId}/topics`),
    enabled: Boolean(courseId),
    staleTime: 60_000,
  });
}

export function useTopicAtlas(topicId: string | null) {
  return useQuery({
    queryKey: catalogKeys.atlas(topicId),
    queryFn: () => api<TopicAtlas>(`/catalog/topics/${topicId}/atlas`),
    enabled: Boolean(topicId),
    staleTime: 60_000,
  });
}
