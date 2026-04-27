#!/usr/bin/env tsx
/**
 * Reads CHANGELOG.md and prints an HTML email body draft for the
 * latest [Unreleased] section. Paste the output into Resend Broadcasts.
 *
 * Usage: pnpm tsx scripts/draft-changelog-email.ts
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

const SECTION_LABELS: Record<string, string> = {
  adicionado: "What's new",
  added: "What's new",
  alterado: "Improvements",
  changed: "Improvements",
  corrigido: "Bug fixes",
  fixed: "Bug fixes",
  removido: "Removed",
  removed: "Removed",
};

interface ParsedSection {
  label: string;
  items: string[];
}

function parseChangelog(content: string): {
  version: string;
  sections: ParsedSection[];
} {
  const lines = content.split("\n");

  // Find the first ## block (Unreleased or versioned)
  const startIdx = lines.findIndex(
    (l) => l.startsWith("## ") && !l.includes("Versões anteriores"),
  );
  if (startIdx === -1) {
    throw new Error("No release section found in CHANGELOG.md");
  }

  const version = lines[startIdx]?.replace(/^##\s*/, "").trim() ?? "Unreleased";

  // Collect lines until next ## block
  const endIdx = lines.findIndex(
    (l, i) => i > startIdx && l.startsWith("## "),
  );
  const block = lines.slice(startIdx + 1, endIdx === -1 ? undefined : endIdx);

  const sections: ParsedSection[] = [];
  let current: ParsedSection | null = null;

  for (const line of block) {
    if (line.startsWith("### ")) {
      const key = line.replace(/^###\s*/, "").trim().toLowerCase();
      const label = SECTION_LABELS[key] ?? line.replace(/^###\s*/, "").trim();
      current = { label, items: [] };
      sections.push(current);
      continue;
    }

    if (current && line.startsWith("- ")) {
      // Strip markdown bold/backticks for plain text items
      const item = line
        .replace(/^-\s*/, "")
        .replace(/\*\*(.*?)\*\*/g, "$1")
        .replace(/`(.*?)`/g, "$1")
        .trim();
      if (item) current.items.push(item);
    }
  }

  return { version, sections: sections.filter((s) => s.items.length > 0) };
}

function renderHtml(version: string, sections: ParsedSection[]): string {
  const sectionHtml = sections
    .map(
      (s) => `
    <tr>
      <td style="padding:16px 0;border-bottom:1px solid #f0f0eb;">
        <p style="margin:0 0 10px;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#163329;">${s.label}</p>
        <ul style="margin:0;padding:0 0 0 18px;">
          ${s.items.map((i) => `<li style="font-size:14px;line-height:1.7;color:#374151;margin-bottom:4px;">${i}</li>`).join("\n          ")}
        </ul>
      </td>
    </tr>`,
    )
    .join("\n");

  return `
<!-- =====================================================================
     Orgaflow changelog email draft — ${version}
     Paste this into Resend Broadcasts > HTML editor.
     Remember to: update subject line, add "Coming soon" section manually,
     and review all content before sending.
===================================================================== -->

<div style="background:#f6f6f1;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;color:#101828;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:620px;" cellspacing="0" cellpadding="0" border="0">

          <!-- Header -->
          <tr>
            <td style="padding:0 0 24px;">
              <span style="font-size:18px;font-weight:700;color:#163329;letter-spacing:-0.02em;">Orgaflow</span>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#ffffff;border:1px solid #e5e7eb;border-radius:20px;overflow:hidden;">

              <!-- Card header -->
              <div style="padding:32px 32px 20px;background:linear-gradient(135deg,#163329 0%,#274d3f 100%);color:#ffffff;">
                <div style="font-size:12px;letter-spacing:0.14em;text-transform:uppercase;opacity:0.78;">Product update</div>
                <h1 style="margin:14px 0 0;font-size:26px;line-height:1.2;">What's new in Orgaflow</h1>
              </div>

              <!-- Card body -->
              <div style="padding:32px;">
                <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#475467;">
                  Here's what shipped since last time.
                </p>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  ${sectionHtml}
                  <!-- TODO: add "Coming soon" section manually -->
                </table>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 0 0;text-align:center;">
              <p style="margin:0;font-size:12px;color:#6b7280;line-height:1.6;">
                You're receiving this because you have an account at Orgaflow.<br/>
                <a href="{{unsubscribe_url}}" style="color:#163329;text-decoration:underline;">Unsubscribe</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</div>
`.trim();
}

function renderSubjectSuggestion(version: string): string {
  const month = new Date().toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });
  return `What's new in Orgaflow — ${month}`;
}

// ---

const changelogPath = join(process.cwd(), "CHANGELOG.md");
const content = readFileSync(changelogPath, "utf-8");
const { version, sections } = parseChangelog(content);

if (sections.length === 0) {
  console.error("No changelog items found. Nothing to draft.");
  process.exit(1);
}

const html = renderHtml(version, sections);
const subject = renderSubjectSuggestion(version);

console.log("=".repeat(60));
console.log("SUGGESTED SUBJECT LINE:");
console.log(subject);
console.log("=".repeat(60));
console.log("\nHTML EMAIL BODY (paste into Resend Broadcasts):\n");
console.log(html);
