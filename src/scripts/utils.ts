export function getFormattedDate(dateString: string): string {
  const today = new Date().toLocaleDateString("id-ID");
  const yesterday = new Date(Date.now() - 86400000).toLocaleDateString("id-ID");
  if (dateString === today) return "Hari Ini";
  if (dateString === yesterday) return "Kemarin";
  return dateString;
}

export function formatTime(date: Date): string {
  return date
    .toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
    .replace(".", ":");
}

export function generateUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
