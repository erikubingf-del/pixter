export function buildPathWithSearch(
  pathname: string,
  search?: string | { toString(): string } | null
): string {
  const query = typeof search === 'string' ? search : search?.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function sanitizeInternalCallbackUrl(
  callbackUrl: string | null | undefined,
  fallback: string
): string {
  if (callbackUrl && callbackUrl.startsWith('/') && !callbackUrl.startsWith('//')) {
    return callbackUrl;
  }

  return fallback;
}
