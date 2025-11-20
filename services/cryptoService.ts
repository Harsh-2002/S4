// A wrapper around Web Crypto API for local storage encryption
// Note: Storing the key in localStorage alongside data does not prevent XSS attacks 
// (as malicious JS can read both), but it obfuscates sensitive data on disk 
// and prevents casual inspection or "over-the-shoulder" leaks.

const ALGORITHM = 'AES-GCM';
const KEY_STORAGE_KEY = 's4_encryption_key';

export class CryptoService {
  private key: CryptoKey | null = null;

  // Initialize or retrieve the encryption key
  async init(): Promise<void> {
    const storedKey = localStorage.getItem(KEY_STORAGE_KEY);
    
    if (storedKey) {
      // Import existing key
      const keyData = Uint8Array.from(atob(storedKey), c => c.charCodeAt(0));
      this.key = await window.crypto.subtle.importKey(
        'raw',
        keyData,
        ALGORITHM,
        true,
        ['encrypt', 'decrypt']
      );
    } else {
      // Generate new key
      this.key = await window.crypto.subtle.generateKey(
        { name: ALGORITHM, length: 256 },
        true,
        ['encrypt', 'decrypt']
      );
      
      // Export and save key (Obfuscation layer)
      const exported = await window.crypto.subtle.exportKey('raw', this.key);
      const keyString = btoa(String.fromCharCode(...new Uint8Array(exported)));
      localStorage.setItem(KEY_STORAGE_KEY, keyString);
    }
  }

  async encrypt(data: any): Promise<string> {
    if (!this.key) await this.init();
    if (!this.key) throw new Error("Crypto key init failed");

    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encodedData = new TextEncoder().encode(JSON.stringify(data));

    const encryptedContent = await window.crypto.subtle.encrypt(
      { name: ALGORITHM, iv },
      this.key,
      encodedData
    );

    // Combine IV and Data for storage: IV(12 bytes) + EncryptedData
    const combined = new Uint8Array(iv.length + encryptedContent.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encryptedContent), iv.length);

    return btoa(String.fromCharCode(...combined));
  }

  async decrypt(encryptedString: string): Promise<any> {
    if (!this.key) await this.init();
    if (!this.key) throw new Error("Crypto key init failed");

    try {
      const combined = Uint8Array.from(atob(encryptedString), c => c.charCodeAt(0));
      
      // Extract IV
      const iv = combined.slice(0, 12);
      const data = combined.slice(12);

      const decryptedContent = await window.crypto.subtle.decrypt(
        { name: ALGORITHM, iv },
        this.key,
        data
      );

      const decoded = new TextDecoder().decode(decryptedContent);
      return JSON.parse(decoded);
    } catch (e) {
      console.error("Decryption failed", e);
      return null;
    }
  }
}

export const cryptoService = new CryptoService();