import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

/** Odak seçici için müfredat (catalog.service). İkon ve zayıf bayrağı sunucudan. */
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
  children: CatalogTopic[];
}

export interface CourseTopics {
  topics: CatalogTopic[];
  summary: { solvedCount: number; mastery: number | null; unresolvedWrongCount: number };
}

export function useCourses(moduleId: string | null | undefined) {
  return useQuery({
    queryKey: ["catalog", "courses", moduleId],
    queryFn: () => api<CatalogCourse[]>(`/catalog/modules/${moduleId}/courses`),
    enabled: Boolean(moduleId),
    staleTime: 10 * 60_000,
  });
}

export function useCourseTopics(courseId: string | null) {
  return useQuery({
    queryKey: ["catalog", "topics", courseId],
    queryFn: () => api<CourseTopics>(`/catalog/courses/${courseId}/topics`),
    enabled: Boolean(courseId),
    staleTime: 60_000,
  });
}
