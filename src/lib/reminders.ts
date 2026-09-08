function base64UrlToUint8Array(value: string): Uint8Array<ArrayBuffer> {
  const padded = value.padEnd(value.length + ((4 - (value.length % 4)) % 4), "=");
  const decoded = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(decoded, (character) => character.charCodeAt(0));
}

export async function enableDeviceReminders(): Promise<"granted" | "denied" | "unsupported"> {
  if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window))
    return "unsupported";
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return "denied";

  const keyResponse = await fetch("/api/push-subscription", { credentials: "same-origin" });
  const keyPayload = (await keyResponse.json()) as { publicKey?: string };
  if (!keyResponse.ok || !keyPayload.publicKey) throw new Error("Не удалось включить уведомления.");

  const registration = await navigator.serviceWorker.register("/reminder-service-worker.js");
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: base64UrlToUint8Array(keyPayload.publicKey),
  });
  const response = await fetch("/api/push-subscription", {
    method: "POST",
    credentials: "same-origin",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      subscription: subscription.toJSON(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    }),
  });
  if (!response.ok) throw new Error("Не удалось сохранить устройство для напоминаний.");
  return "granted";
}
