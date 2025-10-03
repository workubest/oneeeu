const store = new Map<string, string>();

export async function get(key: string): Promise<string | null> {
  return store.get(key) || null;
}

export async function set(key: string, value: string): Promise<void> {
  store.set(key, value);
}

export async function del(key: string): Promise<void> {
  store.delete(key);
}