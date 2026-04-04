import "server-only";

type AuthErrorLike = {
  type?: string;
  cause?: unknown;
};

export function isJWTSessionError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const authError = error as AuthErrorLike;

  return authError.type === "JWTSessionError";
}

type NextDynamicServerUsageErrorLike = {
  digest?: string;
};

export function isNextDynamicServerUsageError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const nextError = error as NextDynamicServerUsageErrorLike;

  return nextError.digest === "DYNAMIC_SERVER_USAGE";
}
