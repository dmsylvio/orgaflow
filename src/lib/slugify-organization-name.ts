const ADJECTIVES = [
  "patient", "clever", "cozy", "sneaky", "serene", "accidental", "lazy",
  "certified", "splendid", "wild", "delightful", "humble", "probable",
  "extra", "professional", "organized", "suspicious", "mostly", "big",
  "absolute", "future", "minimum", "aggressive", "deep", "good",
  "chaotic", "silent", "rapid", "golden", "cosmic", "tiny", "ancient",
  "bold", "calm", "daring", "eager", "fancy", "gentle", "happy",
  "jolly", "kind", "lively", "mighty", "noble", "odd", "peppy",
  "quirky", "radiant", "swift", "tidy", "upbeat", "vivid", "witty",
  "zesty", "breezy", "chunky", "dapper", "fluffy", "groovy", "lucky",
] as const;

const NOUNS = [
  "platypus", "raccoon", "muffin", "potato", "penguin", "guild", "labs",
  "studio", "crew", "collective", "squad", "den", "hq", "dept", "co",
  "works", "hub", "base", "nest", "forge", "vault", "cloud", "spark",
  "wave", "peak", "grove", "zone", "core", "deck", "orbit", "pulse",
  "ridge", "shelf", "tower", "yard", "bench", "camp", "dock", "edge",
  "flare", "gate", "haven", "isle", "junction", "knot", "lodge", "mesa",
  "node", "outpost", "patch", "reef", "silo", "track", "union", "vibe",
  "wharf", "axis", "bay", "cove", "burrow",
] as const;

function pickRandom<T extends readonly string[]>(arr: T): string {
  return arr[Math.floor(Math.random() * arr.length)] ?? arr[0];
}

/** Returns a random adjective-noun slug. ~3,600 unique base combinations. */
export function slugifyOrganizationName(): string {
  return `${pickRandom(ADJECTIVES)}-${pickRandom(NOUNS)}`;
}
