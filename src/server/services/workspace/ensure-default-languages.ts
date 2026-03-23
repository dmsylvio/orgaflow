import type { DbClient } from "@/server/db";
import { languages } from "@/server/db/schemas";

const DEFAULT_LANGUAGES = [
  { code: "ar",    name: "Arabic"                  },
  { code: "cs",    name: "Czech"                   },
  { code: "hr",    name: "Croatian"                },
  { code: "nl",    name: "Dutch"                   },
  { code: "en",    name: "English"                 },
  { code: "fr",    name: "French"                  },
  { code: "de",    name: "German"                  },
  { code: "el",    name: "Greek"                   },
  { code: "it",    name: "Italian"                 },
  { code: "ja",    name: "Japanese"                },
  { code: "ko",    name: "Korean"                  },
  { code: "lv",    name: "Latvian"                 },
  { code: "pl",    name: "Polish"                  },
  { code: "pt_BR", name: "Portuguese (Brazilian)"  },
  { code: "sr",    name: "Serbian Latin"           },
  { code: "sk",    name: "Slovak"                  },
  { code: "es",    name: "Spanish"                 },
  { code: "sv",    name: "Svenska"                 },
  { code: "th",    name: "ไทย"                     },
  { code: "vi",    name: "Tiếng Việt"              },
] as const;

/**
 * Inserts the supported language catalog when the table is empty.
 * Runs at most once per database — subsequent calls are no-ops.
 */
export async function ensureDefaultLanguages(db: DbClient): Promise<void> {
  const existing = await db
    .select({ code: languages.code })
    .from(languages)
    .limit(DEFAULT_LANGUAGES.length);

  const existingCodes = new Set(existing.map((language) => language.code));
  const missingLanguages = DEFAULT_LANGUAGES.filter(
    (language) => !existingCodes.has(language.code),
  );

  if (missingLanguages.length === 0) return;

  await db.insert(languages).values(
    missingLanguages.map((l) => ({
      code: l.code,
      name: l.name,
    })),
  );
}
