/** Messages for the `?error=` code Better Auth adds when a magic link fails. */
const MAGIC_LINK_ERRORS: Record<string, string> = {
  INVALID_TOKEN:
    "That sign-in link is invalid or was already used. Request a new one.",
  EXPIRED_TOKEN: "That sign-in link has expired. Request a new one.",
  ATTEMPTS_EXCEEDED: "That sign-in link was already used. Request a new one.",
};

export function magicLinkErrorMessage(code: string): string {
  return (
    MAGIC_LINK_ERRORS[code.toUpperCase()] ??
    "That sign-in link didn't work. Request a new one."
  );
}
