export type AuthActionResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; message: string };
