import { curve } from 'libsignal';
import { randomBytes, randomUUID } from 'crypto';
import {
  KeyPair,
  ValueReplacer,
  ValueReviver,
  AppDataSync,
  Fingerprint,
  AuthenticationCreds,
  SessionValidationError,
} from '../Types';

/**
 * Cryptographic utilities for WhatsApp authentication and key management
 */
export class CryptoUtils {
  /**
   * Generates a new cryptographic key pair using the Signal protocol
   * @returns A new key pair with public and private keys
   * @throws {SessionValidationError} If key generation fails
   */
  static generateKeyPair(): KeyPair {
    try {
      const { pubKey, privKey } = curve.generateKeyPair();
      return {
        private: Buffer.from(privKey),
        public: Buffer.from(pubKey.slice(1)), // Remove the first byte (0x05 prefix)
      };
    } catch (error) {
      throw new SessionValidationError(
        'Failed to generate key pair',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Generates a Signal protocol compatible public key
   * Ensures the public key has the correct format with 0x05 prefix
   * @param pubKey - The public key bytes
   * @returns Properly formatted public key
   */
  static generateSignalPubKey(pubKey: Uint8Array): Buffer {
    return pubKey.length === 33 ? Buffer.from(pubKey) : Buffer.concat([Buffer.from([5]), pubKey]);
  }

  /**
   * Signs data using a private key with the Signal protocol
   * @param privateKey - The private key for signing
   * @param data - The data to sign
   * @returns The signature bytes
   * @throws {SessionValidationError} If signing fails
   */
  static sign(privateKey: object, data: Uint8Array): Uint8Array {
    try {
      return curve.calculateSignature(privateKey, data);
    } catch (error) {
      throw new SessionValidationError(
        'Failed to sign data',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Creates a signed key pair for the Signal protocol
   * @param identityKeyPair - The identity key pair for signing
   * @param keyId - Unique identifier for this key
   * @returns A signed key pair with signature
   * @throws {SessionValidationError} If key pair creation fails
   */
  static createSignedKeyPair(identityKeyPair: KeyPair, keyId: number) {
    try {
      const preKey = this.generateKeyPair();
      const pubKey = this.generateSignalPubKey(preKey.public);
      const signature = this.sign(identityKeyPair.private, pubKey);

      return {
        keyPair: preKey,
        signature,
        keyId,
        timestampS: Math.floor(Date.now() / 1000),
      };
    } catch (error) {
      throw new SessionValidationError(
        `Failed to create signed key pair for keyId: ${keyId}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Allocates a Uint8Array for base64 string processing
   * @param str - Base64 string to process
   * @returns Allocated Uint8Array with proper size
   */
  static allocateForBase64(str: string): Uint8Array {
    let p = str.length;

    if (!p) {
      return new Uint8Array(1);
    }

    let n = 0;
    // Count padding characters
    while (--p % 4 > 1 && str.charAt(p) === '=') {
      ++n;
    }

    const size = Math.ceil(str.length * 3) / 4 - n;
    return new Uint8Array(size).fill(0);
  }
}

/**
 * Timestamp parsing utilities
 */
export class TimestampUtils {
  /**
   * Parses various timestamp formats into a consistent number
   * @param timestamp - Timestamp in string, number, or Long format
   * @returns Parsed timestamp as number
   */
  static parseTimestamp(timestamp: string | number | any): number {
    if (typeof timestamp === 'string') {
      const parsed = parseInt(timestamp, 10);
      if (isNaN(parsed)) {
        throw new SessionValidationError(`Invalid timestamp string: ${timestamp}`);
      }
      return parsed;
    }

    if (typeof timestamp === 'number') {
      return timestamp;
    }

    // Handle Long type or objects with similar structure
    if (timestamp && typeof timestamp.toNumber === 'function') {
      return timestamp.toNumber();
    }

    if (timestamp && typeof timestamp.toString === 'function') {
      return parseInt(timestamp.toString(), 10);
    }

    throw new SessionValidationError(`Unsupported timestamp type: ${typeof timestamp}`);
  }
}

/**
 * Converts AppDataSync object from various formats to a standardized format
 * @param args - AppDataSync data in various formats
 * @returns Standardized AppDataSync object
 * @throws {SessionValidationError} If conversion fails
 */
export function fromObject(args: AppDataSync): AppDataSync {
  try {
    // Ensure fingerprint is properly structured
    const fingerprint: Fingerprint = {
      rawId: args.fingerprint?.rawId || 0,
      currentIndex: args.fingerprint?.currentIndex || args.fingerprint?.rawId || 0,
      deviceIndexes: Array.isArray(args.fingerprint?.deviceIndexes)
        ? args.fingerprint.deviceIndexes
        : [],
    };

    const result: AppDataSync = {
      keyData: Array.isArray(args.keyData)
        ? new Uint8Array(args.keyData)
        : args.keyData instanceof Uint8Array
          ? args.keyData
          : new Uint8Array(),
      fingerprint,
      timestamp: TimestampUtils.parseTimestamp(args.timestamp),
    };

    // Handle base64 string keyData
    if (typeof args.keyData === 'string') {
      result.keyData = CryptoUtils.allocateForBase64(args.keyData);
    }

    return result;
  } catch (error) {
    throw new SessionValidationError(
      'Failed to convert AppDataSync object',
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * JSON utilities for Buffer serialization/deserialization
 * Handles proper conversion of Buffer objects in JSON
 */
export const BufferJSON = {
  /**
   * JSON replacer function for Buffer objects
   * Converts Buffer objects to base64 strings for JSON serialization
   * @param _ - JSON key (unused)
   * @param value - Value to potentially replace
   * @returns Replaced value or original value
   */
  replacer: (_: string, value: ValueReplacer | any): any => {
    if (value?.type === 'Buffer' && Array.isArray(value?.data)) {
      return {
        type: 'Buffer',
        data: Buffer.from(value.data).toString('base64'),
      };
    }
    return value;
  },

  /**
   * JSON reviver function for Buffer objects
   * Converts base64 strings back to Buffer objects during JSON parsing
   * @param _ - JSON key (unused)
   * @param value - Value to potentially revive
   * @returns Revived Buffer or original value
   */
  reviver: (_: string, value: ValueReviver | any): any => {
    if (value?.type === 'Buffer') {
      try {
        return Buffer.from(value.data, 'base64');
      } catch (error) {
        throw new SessionValidationError(
          'Failed to revive Buffer from base64',
          error instanceof Error ? error : undefined
        );
      }
    }
    return value;
  },
};

/**
 * Initializes authentication credentials for a new WhatsApp session
 * Creates all necessary cryptographic keys and settings
 * @returns Complete authentication credentials
 * @throws {SessionValidationError} If credential initialization fails
 */
export function initAuthCreds(): AuthenticationCreds {
  try {
    const identityKey = CryptoUtils.generateKeyPair();

    return {
      // Core Signal protocol keys
      noiseKey: CryptoUtils.generateKeyPair(),
      pairingEphemeralKeyPair: CryptoUtils.generateKeyPair(),
      signedIdentityKey: identityKey,
      signedPreKey: CryptoUtils.createSignedKeyPair(identityKey, 1),
      registrationId: (Uint16Array.from(randomBytes(2))[0] ?? 0) & 16383,

      // WhatsApp specific credentials
      advSecretKey: randomBytes(32).toString('base64'),
      processedHistoryMessages: [],
      nextPreKeyId: 1,
      firstUnuploadedPreKeyId: 1,
      accountSyncCounter: 0,
      accountSettings: {
        unarchiveChats: false,
      },

      // Device identifiers
      deviceId: Buffer.from(randomUUID().replace(/-/g, ''), 'hex').toString('base64url'),
      phoneId: randomUUID(),
      identityId: randomBytes(20),
      backupToken: randomBytes(20),

      // Registration state
      registered: false,
      registration: {} as any,

      // Optional fields
      pairingCode: undefined,
      lastPropHash: undefined,
      routingInfo: undefined,
    };
  } catch (error) {
    throw new SessionValidationError(
      'Failed to initialize authentication credentials',
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Validation utilities for session data
 */
export class ValidationUtils {
  /**
   * Validates if a string is a valid session identifier
   * @param session - Session string to validate
   * @returns True if valid, false otherwise
   */
  static isValidSessionId(session: string): boolean {
    if (!session || typeof session !== 'string') {
      return false;
    }

    // Session ID should be alphanumeric and reasonable length
    return /^[a-zA-Z0-9_-]{1,100}$/.test(session);
  }

  /**
   * Validates MongoDB collection name
   * @param collectionName - Collection name to validate
   * @returns True if valid, false otherwise
   */
  static isValidCollectionName(collectionName: string): boolean {
    if (!collectionName || typeof collectionName !== 'string') {
      return false;
    }

    // MongoDB collection name restrictions
    return /^[a-zA-Z0-9_-]{1,120}$/.test(collectionName) && !collectionName.startsWith('system.');
  }

  /**
   * Validates authentication credentials structure
   * @param creds - Credentials to validate
   * @returns True if valid, false otherwise
   */
  static isValidAuthCreds(creds: any): creds is AuthenticationCreds {
    return !!(
      creds &&
      creds.signedIdentityKey &&
      creds.signedPreKey &&
      typeof creds.registrationId === 'number' &&
      creds.noiseKey &&
      creds.pairingEphemeralKeyPair &&
      typeof creds.advSecretKey === 'string'
    );
  }
}

// Export legacy functions for backward compatibility
/** @deprecated Use CryptoUtils.generateKeyPair() instead */
export const generateKeyPair = CryptoUtils.generateKeyPair;

/** @deprecated Use CryptoUtils.generateSignalPubKey() instead */
export const generateSignalPubKey = CryptoUtils.generateSignalPubKey;

/** @deprecated Use CryptoUtils.sign() instead */
export const sign = CryptoUtils.sign;

/** @deprecated Use CryptoUtils.createSignedKeyPair() instead */
export const signedKeyPair = CryptoUtils.createSignedKeyPair;
