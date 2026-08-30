import { fetchCloudWorkspace } from "@/cloud/client";
import type { LifeArea } from "@/domain/types";

export async function fetchLifeAreas(): Promise<LifeArea[]> {
  return (await fetchCloudWorkspace()).lifeAreas;
}
