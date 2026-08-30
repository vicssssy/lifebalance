import { fetchCloudWorkspace, mutateCloudWorkspace } from "@/cloud/client";
import type { Reflection } from "@/domain/types";

export async function fetchReflections(): Promise<Reflection[]> {
  return (await fetchCloudWorkspace()).reflections;
}

export async function saveReflection(input: {
  userId?: string;
  month: string;
  answers: Partial<
    Record<
      "real_result" | "effective_actions" | "obstacles" | "system_change" | "next_experiment",
      string | null
    >
  >;
}): Promise<void> {
  await mutateCloudWorkspace({
    type: "saveReflection",
    month: input.month,
    answers: input.answers,
  });
}
