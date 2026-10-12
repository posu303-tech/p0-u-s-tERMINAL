/**
 * WebCrypto AES-256-GCM + PBKDF2 End-to-End Encrypted Local Vault
 * Provides zero-configuration cryptographic security running seamlessly on any GitHub clone.
 */

import { AlertRule, AlertTriggerLog, VaultState } from '../types/market';

const DB_NAME = 'p0$u_tERMINAL_Vault_DB';
const DB_VERSION = 1;
const STORE_NAME = 'secure_store';
const VAULT_RECORD_KEY = 'e2ee_vault_record';

interface EncryptedPayload {
  saltHex: string;
  ivHex: string;
  ciphertextHex: string;
  version: number;
  updatedAt: number;
}

export interface DecryptedVaultPayload {
  watchlists: string[];
  alerts: AlertRule[];
  triggerLogs: AlertTriggerLog[];
  userNotes: Record<string, string>;
  offlineSnapshots?: Record<string, any>;
}

// Convert ArrayBuffer to Hex string
function bufToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Convert Hex string to Uint8Array
function hexToBuf(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

// Open or initialize IndexedDB
function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('IndexedDB not supported in this browser.'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Derive AES-GCM Key using PBKDF2 from Master Password/PIN
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const passwordKey = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: 100000,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Encrypt plaintext JSON with AES-256-GCM
async function encryptData(data: DecryptedVaultPayload, password: string): Promise<EncryptedPayload> {
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);

  const enc = new TextEncoder();
  const plaintext = enc.encode(JSON.stringify(data));

  const ciphertext = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    plaintext
  );

  return {
    saltHex: bufToHex(salt.buffer),
    ivHex: bufToHex(iv.buffer),
    ciphertextHex: bufToHex(ciphertext),
    version: 1,
    updatedAt: Date.now(),
  };
}

// Decrypt AES-256-GCM ciphertext
async function decryptData(payload: EncryptedPayload, password: string): Promise<DecryptedVaultPayload> {
  const salt = hexToBuf(payload.saltHex);
  const iv = hexToBuf(payload.ivHex);
  const ciphertext = hexToBuf(payload.ciphertextHex);

  const key = await deriveKey(password, salt);

  try {
    const decrypted = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv as BufferSource },
      key,
      ciphertext as BufferSource
    );
    const dec = new TextDecoder();
    return JSON.parse(dec.decode(decrypted)) as DecryptedVaultPayload;
  } catch {
    throw new Error('Invalid master password or decryption key.');
  }
}

// Read raw record from IndexedDB
async function readEncryptedRecord(): Promise<EncryptedPayload | null> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(VAULT_RECORD_KEY);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    // Fallback to localStorage if IndexedDB has issues
    const fallback = localStorage.getItem(VAULT_RECORD_KEY);
    return fallback ? JSON.parse(fallback) : null;
  }
}

// Save raw record to IndexedDB
async function saveEncryptedRecord(payload: EncryptedPayload): Promise<void> {
  try {
    const db = await getDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(payload, VAULT_RECORD_KEY);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // Fallback
    localStorage.setItem(VAULT_RECORD_KEY, JSON.stringify(payload));
  }
}

// In-memory active session cache
let activePassword: string | null = null;
let activeDecryptedData: DecryptedVaultPayload = {
  watchlists: ['RELIANCE', 'TCS', 'HDFCBANK', 'NIFTY 50', 'GOLD_MCX'],
  alerts: [],
  triggerLogs: [],
  userNotes: {},
  offlineSnapshots: {},
};

export const CryptoVault = {
  // Check if vault has been initialized previously
  async isVaultInitialized(): Promise<boolean> {
    const record = await readEncryptedRecord();
    return record !== null;
  },

  // Setup a new vault with master passkey
  async setupNewVault(password: string, initialPayload?: Partial<DecryptedVaultPayload>): Promise<DecryptedVaultPayload> {
    if (!password || password.length < 4) {
      throw new Error('Master password/PIN must be at least 4 characters.');
    }
    const data: DecryptedVaultPayload = {
      watchlists: initialPayload?.watchlists || ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'CRUDEOIL_MCX'],
      alerts: initialPayload?.alerts || [],
      triggerLogs: initialPayload?.triggerLogs || [],
      userNotes: initialPayload?.userNotes || {},
      offlineSnapshots: initialPayload?.offlineSnapshots || {},
    };

    const encrypted = await encryptData(data, password);
    await saveEncryptedRecord(encrypted);

    activePassword = password;
    activeDecryptedData = data;
    return data;
  },

  // Unlock existing vault
  async unlockVault(password: string): Promise<DecryptedVaultPayload> {
    const record = await readEncryptedRecord();
    if (!record) {
      throw new Error('Vault is not initialized. Please set up a new vault.');
    }
    const decrypted = await decryptData(record, password);
    activePassword = password;
    activeDecryptedData = decrypted;
    return decrypted;
  },

  // Check if unlocked in memory
  isUnlocked(): boolean {
    return activePassword !== null;
  },

  // Lock the vault immediately
  lockVault(): void {
    activePassword = null;
  },

  // Get current active decrypted data
  getActiveData(): DecryptedVaultPayload {
    return activeDecryptedData;
  },

  // Save changes to vault (re-encrypts and persists)
  async persistActiveData(newData: Partial<DecryptedVaultPayload>): Promise<void> {
    activeDecryptedData = {
      ...activeDecryptedData,
      ...newData,
    };

    if (activePassword) {
      const encrypted = await encryptData(activeDecryptedData, activePassword);
      await saveEncryptedRecord(encrypted);
    }
  },

  // Export encrypted backup file (.bpvault.json) for cross-machine migration
  async exportEncryptedVaultJSON(): Promise<string> {
    const record = await readEncryptedRecord();
    if (!record) throw new Error('No vault record to export.');
    return JSON.stringify({
      app: "p0$u's tERMINAL",
      exportDate: new Date().toISOString(),
      encryption: 'AES-256-GCM',
      kdf: 'PBKDF2-SHA256-100K',
      payload: record,
    }, null, 2);
  },

  // Import encrypted backup
  async importEncryptedVaultJSON(jsonStr: string, password: string): Promise<DecryptedVaultPayload> {
    const parsed = JSON.parse(jsonStr);
    const payload = parsed.payload || parsed;
    if (!payload.ciphertextHex || !payload.ivHex || !payload.saltHex) {
      throw new Error('Invalid vault backup file format.');
    }
    const decrypted = await decryptData(payload, password);
    await saveEncryptedRecord(payload);
    activePassword = password;
    activeDecryptedData = decrypted;
    return decrypted;
  },
};
