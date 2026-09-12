/**
 * Normalizes low-level browser or server network errors into user-friendly messages.
 */
export function normalizeErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    const message = err.message.toLowerCase();
    if (
      message.includes("failed to fetch") ||
      message.includes("networkerror") ||
      message.includes("load failed") ||
      message.includes("network request failed") ||
      err.name === "TypeError"
    ) {
      return "Unable to connect to the server. Please check your connection or try again later.";
    }
    return err.message;
  }
  return "An unexpected error occurred. Please try again.";
}
