/**
 * Baileys Session Manager for MongoDB
 * 
 * A professional MongoDB session manager for the Baileys WhatsApp Web API library.
 * Provides secure, efficient, and reliable session storage with comprehensive error handling,
 * retry logic, and full TypeScript support.
 * 
 * @version 1.0.0
 * @author Eshan Chathuranga
 * @license MIT
 * 
 * @example
 * ```typescript
 * import { useMongoAuthState } from 'baileys-session-manager-mongodb';
 * 
 * const { state, saveCreds, clear } = await useMongoAuthState(
 *   'mongodb://localhost:27017/whatsapp',
 *   { session: 'my-session-id' }
 * );
 * 
 * // Use with Baileys
 * const sock = makeWASocket({
 *   auth: state,
 *   // ... other options
 * });
 * ```
 */

// Core exports
export { 
    useMongoAuthState, 
    MongoSessionManager 
} from "./Mongo";

// Type exports
export type {
    // Configuration types
    MongoConfig,
    MongoSessionDocument,
    
    // Authentication types
    AuthenticationState,
    AuthenticationCreds,
    SignalKeyStore,
    SignalDataSet,
    SignalDataTypeMap,
    
    // Core data types
    Contact,
    Account,
    SignedKeyPair,
    ProtocolAddress,
    SignalIdentity,
    LTHashState,
    SignalCreds,
    AccountSettings,
    RegistrationOptions,
    SslOptions,
    Fingerprint,
    AppDataSync,
    KeyPair,
    
    // Utility types
    ValueReplacer,
    ValueReviver,
    Awaitable,
    
    // Error types
    SessionManagerError,
    MongoConnectionError,
    SessionValidationError
} from "./Types";

// Utility exports
export {
    // Crypto utilities
    CryptoUtils,
    TimestampUtils,
    ValidationUtils,
    
    // JSON utilities
    BufferJSON,
    
    // Helper functions
    fromObject,
    initAuthCreds,
    
    // Legacy exports for backward compatibility
    generateKeyPair,
    generateSignalPubKey,
    sign,
    signedKeyPair
} from "./Utils";

// Default export for convenience
export { useMongoAuthState as default } from "./Mongo";

/**
 * Library version information
 */
export const VERSION = "1.0.0";

/**
 * Library metadata
 */
export const LIBRARY_INFO = {
    name: "baileys-session-manager-mongodb",
    version: VERSION,
    description: "Professional MongoDB session manager for Baileys WhatsApp Web API",
    author: "Eshan Chathuranga",
    license: "MIT",
    repository: "https://github.com/yourusername/baileys-session-manager-mongodb"
} as const;