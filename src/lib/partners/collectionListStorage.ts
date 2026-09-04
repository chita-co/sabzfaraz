"use client";

const STORAGE_KEY = "sf_partner_collection_list";

export function getCollectionListIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addToCollectionList(ids: string[]) {
  const current = new Set(getCollectionListIds());
  ids.forEach((id) => current.add(id));
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(current)));
  window.dispatchEvent(new Event("sf-collection-list-changed"));
}

export function removeFromCollectionList(id: string) {
  const current = getCollectionListIds().filter((i) => i !== id);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  window.dispatchEvent(new Event("sf-collection-list-changed"));
}

export function clearCollectionList() {
  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event("sf-collection-list-changed"));
}