export async function tryCatch<T, E = unknown>(fn: () => Promise<T>): Promise<{ data: T | null; error: E | null }> {
    try {
      const data = await fn();
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error as E };
    }
  }
  