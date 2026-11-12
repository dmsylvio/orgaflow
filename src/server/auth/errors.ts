import "server-only";

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
