import mongoose, { Document, Model, Schema } from 'mongoose';

/**
 * Generic type for values that can be either synchronous or asynchronous
 * @template T - The type that can be awaited
 */
export type Awaitable<T> = T | Promise<T>;

/**
 * Represents a WhatsApp contact with all available information
 */
export interface Contact {
  /** Unique identifier for the contact */
  id: string;
  /** Local identifier (if available) */
  lid?: string;
  /** Display name of the contact */
  name?: string;
  /** Notification name shown in chat */
  notify?: string;
  /** Verified business name (for business accounts) */
  verifiedName?: string;
  /** Profile picture URL */
  imgUrl?: string | null;
  /** Status message of the contact */
  status?: string;
}

/**
 * WhatsApp account information and signatures
 */
export interface Account {
  /** Account details in binary format */
  details?: Uint8Array | null;
  /** Public key for account signature verification */
  accountSignatureKey?: Uint8Array | null;
  /** Account signature for authentication */
  accountSignature?: Uint8Array | null;
  /** Device-specific signature */
  deviceSignature?: Uint8Array | null;
}

/**
 * Cryptographic key pair with signature for WhatsApp protocol
 */
export interface SignedKeyPair {
  /** The actual key pair (public/private) */
  keyPair: KeyPair;
  /** Cryptographic signature of the key pair */
  signature: Uint8Array;
  /** Unique identifier for this key */
  keyId: number;
  /** Timestamp when the key was created (optional) */
  timestampS?: number;
}

/**
 * Protocol address for Signal encryption
 */
export interface ProtocolAddress {
  /** Name/identifier of the address */
  name: string;
  /** Device ID associated with the address */
  deviceId: number;
}

/**
 * Signal identity containing address and identity key
 */
export interface SignalIdentity {
  /** Protocol address identifier */
  identifier: ProtocolAddress;
  /** Identity key for this address */
  identifierKey: Uint8Array;
}

/**
 * Long Term Hash state for app state synchronization
 */
export interface LTHashState {
  /** Version of the hash state */
  version: number;
  /** Hash value as buffer */
  hash: Buffer;
  /** Index to value mapping with MAC verification */
  indexValueMap: {
    [indexMacBase64: string]: {
      /** MAC value for verification */
      valueMac: Uint8Array | Buffer;
    };
  };
}

/**
 * Core Signal protocol credentials
 */
export interface SignalCreds {
  /** Primary identity key pair (read-only) */
  readonly signedIdentityKey: KeyPair;
  /** Signed pre-key for key exchange (read-only) */
  readonly signedPreKey: SignedKeyPair;
  /** Registration ID for this device (read-only) */
  readonly registrationId: number;
}

/**
 * User account settings and preferences
 */
export interface AccountSettings {
  /** Whether to automatically unarchive chats */
  unarchiveChats: boolean;
  /** Default disappearing message settings */
  defaultDisappearingMode?: Pick<any, 'ephemeralExpiration' | 'ephemeralSettingTimestamp'>;
}

/**
 * Signal protocol key store interface for managing cryptographic keys
 */
export interface SignalKeyStore {
  /**
   * Retrieve keys of a specific type by their IDs
   * @template T - The key type from SignalDataTypeMap
   * @param type - Type of keys to retrieve
   * @param ids - Array of key IDs to fetch
   * @returns Promise resolving to mapping of ID to key data
   */
  get<T extends keyof SignalDataTypeMap>(
    type: T,
    ids: string[]
  ): Awaitable<{ [id: string]: SignalDataTypeMap[T] }>;

  /**
   * Store multiple keys of different types
   * @param data - Object containing keys organized by type and ID
   * @returns Promise that resolves when storage is complete
   */
  set(data: SignalDataSet): Awaitable<void>;

  /**
   * Clear all stored keys (optional method)
   * @returns Promise that resolves when clearing is complete
   */
  clear?(): Awaitable<void>;
}

/**
 * Registration options for WhatsApp account setup
 */
export interface RegistrationOptions {
  /** Full phone number (optional) */
  phoneNumber?: string;
  /** Country code (e.g., "1" for US) */
  phoneNumberCountryCode: string;
  /** National number without country code */
  phoneNumberNationalNumber: string;
  /** Mobile country code */
  phoneNumberMobileCountryCode: string;
  /** Mobile network code */
  phoneNumberMobileNetworkCode: string;
  /** Registration method */
  method?: 'sms' | 'voice' | 'captcha';
  /** Captcha solution if required */
  captcha?: string;
}

/**
 * SSL/TLS configuration options for secure connections
 */
export interface SslOptions {
  /** Path to .pfx or .p12 file */
  pfx?: string;
  /** Private key (string, array, or Buffer) */
  key?: string | string[] | Buffer | Buffer[];
  /** Passphrase for private key */
  passphrase?: string;
  /** Certificate (string, array, or Buffer) */
  cert?: string | string[] | Buffer | Buffer[];
  /** Certificate Authority */
  ca?: string | string[] | Buffer | Buffer[];
  /** Certificate Revocation List */
  crl?: string | string[];
  /** Cipher suites to use */
  ciphers?: string;
  /** Whether to reject unauthorized certificates */
  rejectUnauthorized?: boolean;
  /** Minimum TLS version */
  minVersion?: string;
  /** Maximum TLS version */
  maxVersion?: string;
  /** Whether to verify identity */
  verifyIdentity?: boolean;
}

/**
 * Device fingerprint information for app state sync
 */
export interface Fingerprint {
  /** Raw fingerprint ID */
  rawId: number;
  /** Current index in the fingerprint */
  currentIndex: number;
  /** Array of device indexes */
  deviceIndexes: number[];
}

/**
 * App data synchronization structure
 */
export interface AppDataSync {
  /** Synchronization key data */
  keyData: Uint8Array;
  /** Device fingerprint */
  fingerprint: Fingerprint;
  /** Timestamp of synchronization */
  timestamp: number;
}

/**
 * Mapping of Signal data types to their corresponding data structures
 */
export interface SignalDataTypeMap {
  /** Session data for encrypted communication */
  session: Uint8Array;
  /** Pre-keys for key exchange */
  'pre-key': KeyPair;
  /** Sender keys for group messaging */
  'sender-key': Uint8Array;
  /** App state synchronization keys */
  'app-state-sync-key': AppDataSync;
  /** App state synchronization versions */
  'app-state-sync-version': LTHashState;
  /** In-memory sender keys for performance */
  'sender-key-memory': {
    [jid: string]: boolean;
  };
}

/**
 * Data set for storing Signal protocol keys
 */
export type SignalDataSet = {
  [T in keyof SignalDataTypeMap]?: {
    [id: string]: SignalDataTypeMap[T] | null;
  };
};

/**
 * Cryptographic key pair (public and private keys)
 */
export interface KeyPair {
  /** Public key bytes */
  public: Uint8Array;
  /** Private key bytes */
  private: Uint8Array;
}

/**
 * MongoDB document interface for session data
 */
export interface MongoSessionDocument extends Document {
  /** Unique document identifier */
  _id: string;
  /** Stored session data */
  value?: object[];
  /** Session identifier for multi-session support */
  session: string;
}

/**
 * Configuration options for MongoDB session manager
 */
export interface MongoConfig {
  /** Name of the MongoDB collection (default: 'baileys-auth') */
  collectionName?: string;
  /** Retry delay in milliseconds for failed queries (default: 200ms) */
  retryRequestDelayMs?: number;
  /** Maximum retry attempts for failed queries (default: 10) */
  maxRetries?: number;
  /** Session name to identify the connection, enabling multi-sessions */
  session: string;
  /** MongoDB connection options */
  mongoOptions?: mongoose.ConnectOptions;
  /** Whether to enable debug logging */
  debug?: boolean;
}

/**
 * JSON serialization helper for Buffer values
 */
export interface ValueReplacer {
  /** Buffer data as number array */
  data: number[];
  /** Type identifier */
  type: string;
}

/**
 * JSON deserialization helper for Buffer values
 */
export interface ValueReviver {
  /** Base64 encoded data */
  data: string;
  /** Type identifier */
  type: string;
}

/**
 * Complete authentication state containing credentials and keys
 */
export interface AuthenticationState {
  /** Authentication credentials */
  creds: AuthenticationCreds;
  /** Signal protocol key store */
  keys: SignalKeyStore;
}

/**
 * Complete set of authentication credentials for WhatsApp
 */
export interface AuthenticationCreds extends SignalCreds {
  /** Noise protocol key pair (read-only) */
  readonly noiseKey: KeyPair;
  /** Ephemeral key pair for pairing (read-only) */
  readonly pairingEphemeralKeyPair: KeyPair;
  /** Advanced secret key for enhanced security */
  advSecretKey: string;
  /** Current user contact information */
  me?: Contact;
  /** Account information and signatures */
  account?: Account;
  /** Array of known signal identities */
  signalIdentities?: SignalIdentity[];
  /** Current app state key identifier */
  myAppStateKeyId?: string;
  /** ID of first unuploaded pre-key */
  firstUnuploadedPreKeyId: number;
  /** Next pre-key ID to be generated */
  nextPreKeyId: number;
  /** Timestamp of last account synchronization */
  lastAccountSyncTimestamp?: number;
  /** Platform identifier */
  platform?: string;
  /** History of processed messages */
  processedHistoryMessages: Pick<any, 'key' | 'messageTimestamp'>[];
  /** Counter for account synchronization */
  accountSyncCounter: number;
  /** User account settings */
  accountSettings: AccountSettings;
  /** Unique device identifier */
  deviceId: string;
  /** Phone identifier */
  phoneId: string;
  /** Identity buffer */
  identityId: Buffer;
  /** Whether the account is registered */
  registered: boolean;
  /** Backup token for account recovery */
  backupToken: Buffer;
  /** Registration options used */
  registration: RegistrationOptions;
  /** Current pairing code (if available) */
  pairingCode?: string | undefined;
  /** Last property hash */
  lastPropHash?: string | undefined;
  /** Routing information */
  routingInfo?: Buffer | undefined;
}

/**
 * Error types specific to the session manager
 */
export class SessionManagerError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'SessionManagerError';
  }
}

/**
 * MongoDB connection error
 */
export class MongoConnectionError extends SessionManagerError {
  constructor(message: string, originalError?: Error) {
    super(message, 'MONGO_CONNECTION_ERROR', originalError);
    this.name = 'MongoConnectionError';
  }
}

/**
 * Session data validation error
 */
export class SessionValidationError extends SessionManagerError {
  constructor(message: string, originalError?: Error) {
    super(message, 'SESSION_VALIDATION_ERROR', originalError);
    this.name = 'SessionValidationError';
  }
}

// Legacy type aliases for backward compatibility
/** @deprecated Use MongoSessionDocument instead */
export type mongoData = MongoSessionDocument;

/** @deprecated Use MongoConfig instead */
export type mongoConfig = MongoConfig;
