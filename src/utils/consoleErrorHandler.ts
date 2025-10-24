export function logErrorToConsole(error: unknown, context: string) {
  if (error instanceof Error) {
    console.error(`Error in ${context}:`, error.message);
  } else {
    console.error(`An unknown error occurred in ${context}:`, error);
  }
}
