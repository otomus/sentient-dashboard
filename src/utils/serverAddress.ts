const STORAGE_KEY = "arqitect_server_address";

/**
 * Reads the saved server address from localStorage.
 *
 * @returns The stored address string, or an empty string if none is saved.
 */
export function getSavedServerAddress(): string {
  return localStorage.getItem(STORAGE_KEY) ?? "";
}

/**
 * Persists a server address to localStorage.
 *
 * @param address - The server address to save (e.g. "localhost:4000").
 */
export function saveServerAddress(address: string): void {
  localStorage.setItem(STORAGE_KEY, address);
}

/**
 * Resolves the effective server address.
 * Checks localStorage first, then falls back to the VITE_SERVER_ADDRESS env var.
 *
 * @returns The resolved address, or an empty string if neither source has a value.
 */
export function resolveServerAddress(): string {
  return getSavedServerAddress() || import.meta.env.VITE_SERVER_ADDRESS || "";
}
