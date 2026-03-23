import type { ZodError } from "zod";
import type { AuthFieldErrors } from "@/types/auth-actions";

/**
 * Converte erros Zod (server actions) para mapa de mensagens por campo.
 * Utilitário partilhado — não contém regras de domínio.
 */
export function zodErrorToFieldErrors(error: ZodError): AuthFieldErrors {
  const out: AuthFieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "root";
    if (!out[key]) {
      out[key] = issue.message;
    }
  }
  return out;
}
