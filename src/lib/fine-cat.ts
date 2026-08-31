/** Map auto-imported fine ids back to the ordinary 14 categories. */
export const TO_PLAIN: Record<string, string> = {
  coffee: "food",
  boba: "food",
  takeout: "food",
  grocery: "food",
  fruit: "food",
  fastfood: "food",
  metro: "transport",
  taxi: "transport",
  bike: "transport",
  fuel: "transport",
  parking: "transport",
  rail: "travel",
  flight: "travel",
  hotel: "travel",
  scenic: "travel",
  utilities: "housing",
  member: "fun",
  game: "fun",
  movie: "fun",
  hair: "fun",
  beauty: "fun",
  clothes: "shopping",
  pharmacy: "health",
  hospital: "health",
  books: "edu",
  sport: "edu",
  redpack: "gift",
  transfer: "gift",
  donate: "gift",
  refund: "income",
  invest: "income",
  "redpack-in": "income",
  "transfer-in": "income",
  insurance: "other",
  service: "other",
  pet: "daily",
  baby: "daily",
};

export function toPlainCategory(id: string): string {
  if (TO_PLAIN[id]) return TO_PLAIN[id];
  if (id.startsWith("raw-")) return "other";
  return id;
}

export function isAutoFineId(id: string): boolean {
  return Boolean(TO_PLAIN[id]) || id.startsWith("raw-");
}
