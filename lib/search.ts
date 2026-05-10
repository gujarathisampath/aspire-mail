import { MailSearchFilters } from "@/lib/types";

const SEARCH_KEYS: (keyof MailSearchFilters)[] = [
  "q",
  "from",
  "exact",
  "dateFrom",
  "dateTo",
  "minSize",
  "maxSize",
];

export function readMailSearchFilters(
  searchParams: Pick<URLSearchParams, "get">,
): MailSearchFilters {
  const filters: MailSearchFilters = {};

  for (const key of SEARCH_KEYS) {
    const value = searchParams.get(key);
    if (value && value.trim()) {
      filters[key] = value.trim();
    }
  }

  return filters;
}

export function buildMailSearchKey(filters: MailSearchFilters): string {
  const params = new URLSearchParams();

  for (const key of SEARCH_KEYS) {
    const value = filters[key];
    if (value) {
      params.set(key, value);
    }
  }

  return params.toString();
}

export function hasMailSearchFilters(filters: MailSearchFilters): boolean {
  return SEARCH_KEYS.some((key) => Boolean(filters[key]));
}