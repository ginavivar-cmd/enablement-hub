"use client";

import { useState, useMemo } from "react";

interface Searchable {
  title?: string | null;
  details?: string | null;
  owner?: string | null;
  audience?: string | null;
}

export function useSearch<T extends Searchable>(items: T[]) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.title?.toLowerCase().includes(q) ||
        item.details?.toLowerCase().includes(q) ||
        item.owner?.toLowerCase().includes(q) ||
        item.audience?.toLowerCase().includes(q)
    );
  }, [items, query]);
  return { query, setQuery, filtered };
}
