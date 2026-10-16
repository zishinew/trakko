// Supabase returns at most 1,000 rows by default. Page through datasets so
// catalog size and historical revenue aren't silently limited by that default.
export async function fetchAll<T>(
  fetchPage: (
    from: number,
    to: number,
  ) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
): Promise<T[]> {
  const results: T[] = [];
  const size = 500;
  for (let from = 0; ; from += size) {
    const { data, error } = await fetchPage(from, from + size - 1);
    if (error) throw new Error(error.message);
    results.push(...(data || []));
    if (!data || data.length < size) return results;
  }
}
