/**
 * Pool of funny, workplace-safe English slugs used as the organization URL slug.
 * Uniqueness is enforced downstream via `assertUniqueOrganizationSlug`.
 */
const FUNNY_ORG_SLUGS = [
  "patient-platypus",
  "clever-raccoon",
  "cozy-muffin-squad",
  "plot-twist-hq",
  "definitely-legit-llc",
  "humble-potato-co",
  "sneaky-penguin-den",
  "chaotic-good-guild",
  "serene-chaos-labs",
  "accidental-genius-inc",
  "coffee-powered-hq",
  "nap-time-industries",
  "lazy-river-logistics",
  "certified-human-people",
  "not-a-robot-probably",
  "splendid-nonsense-co",
  "wildcard-energy",
  "the-good-vibes-dept",
  "mystery-flavor-studio",
  "delightful-chaos-llc",
  "banana-republic-but-legal",
  "we-tried-our-best",
  "probably-fine-inc",
  "trust-the-process-co",
  "vibes-and-spreadsheets",
  "slightly-above-average",
  "extra-medium-studios",
  "just-winging-it-ltd",
  "professional-chaos-co",
  "organized-confusion-hq",
  "suspiciously-productive",
  "technically-a-business",
  "mostly-harmless-llc",
  "404-motivation-not-found",
  "big-brain-energy-co",
  "absolutely-no-drama",
  "future-billionaires-maybe",
  "ctrl-alt-defeat",
  "works-on-my-machine-inc",
  "ship-it-and-pray",
  "pivot-again-studios",
  "minimum-viable-vibes",
  "synergy-is-a-myth-llc",
  "aggressive-mediocrity",
  "certified-overthinking-co",
  "noodles-and-hustle",
  "deep-breath-collective",
  "side-quest-headquarters",
  "good-enough-industries",
] as const;

function pickRandomFunnyOrgSlug(): string {
  const index = Math.floor(Math.random() * FUNNY_ORG_SLUGS.length);
  return FUNNY_ORG_SLUGS[index] ?? "humble-potato-co";
}

/** Returns a random funny English organization URL slug. */
export function slugifyOrganizationName(): string {
  return pickRandomFunnyOrgSlug();
}
