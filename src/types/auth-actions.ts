/**
 * Shared result shape for auth-related server actions consumed by forms.
 */
export type AuthFieldErrors = Record<string, string>;

export type AuthActionResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; message: string; fieldErrors?: AuthFieldErrors };
