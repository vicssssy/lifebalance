import type { CloudWorkspaceOperation, CloudWorkspacePayload } from "./types";
import { todayKey } from "@/domain/schedule";
import { readLegacyWorkspaceSnapshot } from "@/lib/local-preview-store";

const API_PATH = "/api/workspace";
let initialization: Promise<CloudWorkspacePayload> | null = null;

async function post<T>(body: unknown): Promise<T> {
  const response = await fetch(API_PATH, {
    method: "POST",
    credentials: "same-origin",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = (await response.json().catch(() => null)) as { data?: T; error?: string } | null;
  if (!response.ok) {
    throw new Error(payload?.error || "Не удалось сохранить данные в облаке.");
  }
  if (!payload || !("data" in payload)) {
    throw new Error("Облачное хранилище вернуло некорректный ответ.");
  }
  return payload.data as T;
}

function initialize(): Promise<CloudWorkspacePayload> {
  initialization ??= post<CloudWorkspacePayload>({
    type: "bootstrap",
    seedDate: todayKey(),
    legacy: readLegacyWorkspaceSnapshot(todayKey()),
  }).catch((error) => {
    initialization = null;
    throw error;
  });
  return initialization;
}

export async function fetchCloudWorkspace(): Promise<CloudWorkspacePayload> {
  if (!initialization) return initialize();
  await initialize();
  return post<CloudWorkspacePayload>({ type: "bootstrap", seedDate: todayKey() });
}

export async function mutateCloudWorkspace<T = null>(
  operation: CloudWorkspaceOperation,
): Promise<T> {
  await initialize();
  return post<T>({ type: "mutate", operation });
}
