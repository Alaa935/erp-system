const STORAGE_KEY = 'wms_api_keys';
const KEY_STORAGE_KEY = 'wms_crypto_key';

interface ApiKeyStore {
  gemini?: string;
}

async function getOrCreateKey(): Promise<CryptoKey> {
  const stored = sessionStorage.getItem(KEY_STORAGE_KEY);
  if (stored) {
    const raw = Uint8Array.from(atob(stored), c => c.charCodeAt(0));
    return crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
  }
  const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  const raw = await crypto.subtle.exportKey('raw', key);
  sessionStorage.setItem(KEY_STORAGE_KEY, btoa(String.fromCharCode(...new Uint8Array(raw))));
  return key;
}

async function encrypt(plaintext: string): Promise<string> {
  const key = await getOrCreateKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);
  return btoa(String.fromCharCode(...combined));
}

async function decrypt(data: string): Promise<string> {
  const key = await getOrCreateKey();
  const combined = Uint8Array.from(atob(data), c => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
  return new TextDecoder().decode(decrypted);
}

export const apiKeyManager = {
  async getGeminiKey(): Promise<string | null> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const store: ApiKeyStore = JSON.parse(raw);
        if (store.gemini) {
          return await decrypt(store.gemini);
        }
      }
    } catch { }
    return null;
  },

  async setGeminiKey(key: string): Promise<void> {
    try {
      let store: ApiKeyStore = {};
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) store = JSON.parse(raw);
      store.gemini = await encrypt(key);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch { }
  },

  async removeGeminiKey(): Promise<void> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const store: ApiKeyStore = JSON.parse(raw);
        delete store.gemini;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
      }
    } catch { }
  },

  async hasGeminiKey(): Promise<boolean> {
    return (await this.getGeminiKey()) !== null;
  },
};
