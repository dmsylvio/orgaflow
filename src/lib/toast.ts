import { type ExternalToast, toast as sonnerToast } from "sonner";

const DEFAULT_SUCCESS_DESCRIPTION = "Your changes were saved successfully.";
const DEFAULT_ERROR_DESCRIPTION =
  "Something went wrong. Please try again in a moment.";
const DEFAULT_WARNING_DESCRIPTION = "Please review the details and try again.";

type ToastOptions = Omit<ExternalToast, "description"> & {
  description?: React.ReactNode;
};

function getErrorDescription(
  error: unknown,
  fallback = DEFAULT_ERROR_DESCRIPTION,
): React.ReactNode {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  if (typeof error === "string" && error.trim()) {
    return error;
  }

  return fallback;
}

function withDescription(
  options: ToastOptions | undefined,
  description: React.ReactNode,
): ExternalToast {
  return {
    ...options,
    description: options?.description ?? description,
  };
}

export const toast = {
  success(title: React.ReactNode, options?: ToastOptions): string | number {
    return sonnerToast.success(
      title,
      withDescription(options, DEFAULT_SUCCESS_DESCRIPTION),
    );
  },

  error(
    title: React.ReactNode,
    options?: ToastOptions & { error?: unknown },
  ): string | number {
    return sonnerToast.error(
      title,
      withDescription(
        options,
        getErrorDescription(options?.error, DEFAULT_ERROR_DESCRIPTION),
      ),
    );
  },

  warning(title: React.ReactNode, options?: ToastOptions): string | number {
    return sonnerToast.warning(
      title,
      withDescription(options, DEFAULT_WARNING_DESCRIPTION),
    );
  },

  info(title: React.ReactNode, options?: ToastOptions): string | number {
    return sonnerToast.info(
      title,
      withDescription(options, DEFAULT_WARNING_DESCRIPTION),
    );
  },

  message(title: React.ReactNode, options?: ToastOptions): string | number {
    return sonnerToast.message(
      title,
      withDescription(options, DEFAULT_WARNING_DESCRIPTION),
    );
  },

  dismiss(toastId?: string | number): void {
    sonnerToast.dismiss(toastId);
  },
};

export { getErrorDescription };
