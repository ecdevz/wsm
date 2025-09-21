import mongoose from "mongoose";
import { BufferJSON, initAuthCreds, fromObject, ValidationUtils } from "../Utils";
import {
    MongoConfig,
    MongoSessionDocument,
    AuthenticationCreds,
    AuthenticationState,
    SignalDataTypeMap,
    MongoConnectionError,
    SessionValidationError
} from "../Types";

/**
 * MongoDB session schema definition
 * Defines the structure for storing session data in MongoDB
 */
const sessionSchema = new mongoose.Schema({
    _id: { 
        type: String, 
        required: true,
        index: true,
        maxlength: 200
    },
    value: { 
        type: mongoose.Schema.Types.Mixed, 
        required: true 
    },
    session: { 
        type: String, 
        required: true,
        index: true,
        maxlength: 100
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    collection: 'baileys_sessions',
    timestamps: false // We're managing timestamps manually
});

// Compound index for efficient queries
sessionSchema.index({ session: 1, _id: 1 });

/**
 * MongoDB session model
 */
const SessionModel = mongoose.model<MongoSessionDocument>("BaileysSession", sessionSchema);

/**
 * MongoDB session manager for Baileys WhatsApp Web API
 * Provides secure and efficient session storage with full error handling
 */
export class MongoSessionManager {
    private readonly config: Required<MongoConfig>;
    private readonly sessionPrefix: string;
    private isConnected: boolean = false;

    /**
     * Creates a new MongoDB session manager instance
     * @param mongoURI - MongoDB connection URI
     * @param config - Configuration options
     * @throws {SessionValidationError} If configuration is invalid
     */
    constructor(
        private readonly mongoURI: string,
        config: MongoConfig
    ) {
        // Validate configuration
        if (!mongoURI || typeof mongoURI !== 'string') {
            throw new SessionValidationError('MongoDB URI is required and must be a string');
        }

        if (!config.session || !ValidationUtils.isValidSessionId(config.session)) {
            throw new SessionValidationError('Valid session identifier is required');
        }

        // Set default configuration values
        this.config = {
            collectionName: config.collectionName || 'baileys-auth',
            retryRequestDelayMs: config.retryRequestDelayMs || 200,
            maxRetries: config.maxRetries || 10,
            session: config.session,
            mongoOptions: config.mongoOptions || {},
            debug: config.debug || false
        };

        // Validate collection name
        if (!ValidationUtils.isValidCollectionName(this.config.collectionName)) {
            throw new SessionValidationError(`Invalid collection name: ${this.config.collectionName}`);
        }

        this.sessionPrefix = `${this.config.session}-`;
        
        if (this.config.debug) {
            console.log(`[BaileysSessionManager] Initialized for session: ${this.config.session}`);
        }
    }

    /**
     * Establishes connection to MongoDB
     * @throws {MongoConnectionError} If connection fails
     */
    private async ensureConnection(): Promise<void> {
        if (this.isConnected && mongoose.connection.readyState === 1) {
            return;
        }

        try {
            if (this.config.debug) {
                console.log('[BaileysSessionManager] Connecting to MongoDB...');
            }

            await mongoose.connect(this.mongoURI, {
                bufferCommands: false,
                maxPoolSize: 10,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
                ...this.config.mongoOptions
            });

            this.isConnected = true;
            
            if (this.config.debug) {
                console.log('[BaileysSessionManager] Successfully connected to MongoDB');
            }
        } catch (error) {
            this.isConnected = false;
            throw new MongoConnectionError(
                'Failed to connect to MongoDB',
                error instanceof Error ? error : undefined
            );
        }
    }

    /**
     * Executes a database operation with retry logic
     * @param operation - The database operation to execute
     * @param operationName - Name of the operation for logging
     * @returns Result of the operation
     * @throws {MongoConnectionError} If operation fails after retries
     */
    private async executeWithRetry<T>(
        operation: () => Promise<T>,
        operationName: string
    ): Promise<T> {
        let lastError: Error | undefined;

        for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
            try {
                await this.ensureConnection();
                return await operation();
            } catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));
                
                if (this.config.debug) {
                    console.warn(
                        `[BaileysSessionManager] ${operationName} attempt ${attempt}/${this.config.maxRetries} failed:`, 
                        lastError.message
                    );
                }

                if (attempt < this.config.maxRetries) {
                    await new Promise(resolve => 
                        setTimeout(resolve, this.config.retryRequestDelayMs)
                    );
                } else {
                    throw new MongoConnectionError(
                        `${operationName} failed after ${this.config.maxRetries} attempts`,
                        lastError
                    );
                }
            }
        }

        throw new MongoConnectionError(
            `${operationName} failed after ${this.config.maxRetries} attempts`,
            lastError
        );
    }

    /**
     * Queries a document from the database
     * @param docId - Document ID to query
     * @returns Document data or null if not found
     * @throws {MongoConnectionError} If query fails
     */
    private async queryDocument(docId: string): Promise<MongoSessionDocument | null> {
        return this.executeWithRetry(async () => {
            const fullId = `${this.sessionPrefix}${docId}`;
            const document = await SessionModel.findById(fullId).lean();
            
            if (this.config.debug && document) {
                console.log(`[BaileysSessionManager] Retrieved document: ${fullId}`);
            }
            
            return document;
        }, `Query document ${docId}`);
    }

    /**
     * Reads and parses data from storage
     * @param id - Data identifier
     * @returns Parsed data or null if not found
     * @throws {SessionValidationError} If data parsing fails
     */
    private async readData(id: string): Promise<any> {
        try {
            const data = await this.queryDocument(id);
            if (!data || !data.value) {
                return null;
            }

            const serializedValue = typeof data.value === "object"
                ? JSON.stringify(data.value)
                : data.value;
                
            return JSON.parse(serializedValue, BufferJSON.reviver);
        } catch (error) {
            if (error instanceof MongoConnectionError) {
                throw error;
            }
            throw new SessionValidationError(
                `Failed to read data for ID: ${id}`,
                error instanceof Error ? error : undefined
            );
        }
    }

    /**
     * Writes data to storage
     * @param id - Data identifier
     * @param value - Data to store
     * @throws {MongoConnectionError} If write operation fails
     */
    private async writeData(id: string, value: object): Promise<void> {
        await this.executeWithRetry(async () => {
            const serializedValue = JSON.stringify(value, BufferJSON.replacer);
            const fullId = `${this.sessionPrefix}${id}`;
            
            await SessionModel.updateOne(
                { _id: fullId },
                { 
                    value: serializedValue, 
                    session: this.config.session,
                    updatedAt: new Date()
                },
                { upsert: true }
            );

            if (this.config.debug) {
                console.log(`[BaileysSessionManager] Stored data for: ${fullId}`);
            }
        }, `Write data ${id}`);
    }

    /**
     * Removes data from storage
     * @param id - Data identifier
     * @throws {MongoConnectionError} If remove operation fails
     */
    private async removeData(id: string): Promise<void> {
        await this.executeWithRetry(async () => {
            const fullId = `${this.sessionPrefix}${id}`;
            await SessionModel.deleteOne({ _id: fullId });
            
            if (this.config.debug) {
                console.log(`[BaileysSessionManager] Removed data for: ${fullId}`);
            }
        }, `Remove data ${id}`);
    }

    /**
     * Clears all session data except credentials
     * @throws {MongoConnectionError} If clear operation fails
     */
    async clearSessionData(): Promise<void> {
        await this.executeWithRetry(async () => {
            await SessionModel.deleteMany({ 
                session: this.config.session, 
                _id: { $ne: `${this.sessionPrefix}creds` } 
            });
            
            if (this.config.debug) {
                console.log(`[BaileysSessionManager] Cleared session data for: ${this.config.session}`);
            }
        }, 'Clear session data');
    }

    /**
     * Removes all data for this session
     * @throws {MongoConnectionError} If removal fails
     */
    async removeAllSessionData(): Promise<void> {
        await this.executeWithRetry(async () => {
            await SessionModel.deleteMany({ session: this.config.session });
            
            if (this.config.debug) {
                console.log(`[BaileysSessionManager] Removed all data for session: ${this.config.session}`);
            }
        }, 'Remove all session data');
    }

    /**
     * Saves authentication credentials
     * @param creds - Authentication credentials to save
     * @throws {SessionValidationError} If credentials are invalid
     * @throws {MongoConnectionError} If save operation fails
     */
    async saveCredentials(creds: AuthenticationCreds): Promise<void> {
        if (!ValidationUtils.isValidAuthCreds(creds)) {
            throw new SessionValidationError('Invalid authentication credentials provided');
        }

        await this.writeData("creds", creds);
    }

    /**
     * Gets the complete authentication state
     * @returns Authentication state with credentials and key store
     * @throws {MongoConnectionError} If retrieval fails
     */
    async getAuthState(): Promise<AuthenticationState> {
        // Load or initialize credentials
        const creds: AuthenticationCreds = (await this.readData("creds")) || initAuthCreds();

        return {
            creds,
            keys: {
                get: async (type, ids) => {
                    const data: { [id: string]: SignalDataTypeMap[typeof type] } = {};
                    
                    for (const id of ids) {
                        try {
                            let value = await this.readData(`${type}-${id}`);
                            if (type === "app-state-sync-key" && value) {
                                value = fromObject(value);
                            }
                            data[id] = value;
                        } catch (error) {
                            if (this.config.debug) {
                                console.warn(
                                    `[BaileysSessionManager] Failed to get ${type}-${id}:`, 
                                    error instanceof Error ? error.message : String(error)
                                );
                            }
                            data[id] = null as any;
                        }
                    }
                    
                    return data;
                },
                set: async data => {
                    for (const category in data) {
                        const categoryKey = category as keyof typeof data;
                        const categoryData = data[categoryKey];
                        
                        if (categoryData) {
                            for (const id in categoryData) {
                                const value = categoryData[id];
                                const dataKey = `${category}-${id}`;
                                
                                try {
                                    if (value) {
                                        await this.writeData(dataKey, value);
                                    } else {
                                        await this.removeData(dataKey);
                                    }
                                } catch (error) {
                                    if (this.config.debug) {
                                        console.error(
                                            `[BaileysSessionManager] Failed to set ${dataKey}:`, 
                                            error instanceof Error ? error.message : String(error)
                                        );
                                    }
                                    throw error;
                                }
                            }
                        }
                    }
                },
                clear: async () => {
                    await this.clearSessionData();
                }
            }
        };
    }

    /**
     * Generic query method for custom operations
     * @param collection - Collection name (for compatibility)
     * @param docId - Document ID to query
     * @returns Document data or null
     */
    async query(collection: string, docId: string): Promise<MongoSessionDocument | null> {
        return this.queryDocument(docId);
    }

    /**
     * Closes the MongoDB connection
     */
    async disconnect(): Promise<void> {
        if (this.isConnected) {
            await mongoose.disconnect();
            this.isConnected = false;
            
            if (this.config.debug) {
                console.log('[BaileysSessionManager] Disconnected from MongoDB');
            }
        }
    }
}

/**
 * Creates a MongoDB authentication state manager
 * @param mongoURI - MongoDB connection URI
 * @param config - Configuration options
 * @returns Object containing state and utility functions
 * @throws {SessionValidationError} If configuration is invalid
 * @throws {MongoConnectionError} If connection fails
 * 
 * @example
 * ```typescript
 * const { state, saveCreds, clear } = await useMongoAuthState('mongodb://localhost:27017/whatsapp', {
 *     session: 'my-session-id'
 * });
 * ```
 */
export async function useMongoAuthState(
    mongoURI: string, 
    config: MongoConfig
): Promise<{
    /** The authentication state for Baileys */
    state: AuthenticationState;
    /** Function to save credentials */
    saveCreds: () => Promise<void>;
    /** Function to clear session data */
    clear: () => Promise<void>;
    /** Function to remove all session data */
    removeCreds: () => Promise<void>;
    /** Function for custom queries */
    query: (collection: string, docId: string) => Promise<MongoSessionDocument | null>;
    /** Function to disconnect from MongoDB */
    disconnect: () => Promise<void>;
}> {
    const manager = new MongoSessionManager(mongoURI, config);
    const state = await manager.getAuthState();

    return {
        state,
        saveCreds: async () => {
            await manager.saveCredentials(state.creds);
        },
        clear: async () => {
            await manager.clearSessionData();
        },
        removeCreds: async () => {
            await manager.removeAllSessionData();
        },
        query: async (collection: string, docId: string) => {
            return manager.query(collection, docId);
        },
        disconnect: async () => {
            await manager.disconnect();
        }
    };
}
