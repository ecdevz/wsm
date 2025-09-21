# Baileys Session Manager for MongoDB

A professional, production-ready MongoDB session manager for the [Baileys WhatsApp Web API](https://github.com/WhiskeySockets/Baileys) library. This package provides secure, efficient, and reliable session storage with comprehensive error handling, retry logic, and full TypeScript support.

[![npm version](https://badge.fury.io/js/baileys-session-manager-mongodb.svg)](https://badge.fury.io/js/baileys-session-manager-mongodb)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ Features

- 🚀 **Production Ready**: Robust error handling and retry logic
- 🛡️ **Type Safe**: Full TypeScript support with comprehensive type definitions
- 🔄 **Auto Retry**: Configurable retry mechanism for database operations
- 🔧 **Multi-Session**: Support for multiple concurrent WhatsApp sessions
- 📊 **Debug Support**: Optional debug logging for troubleshooting
- 🔒 **Secure**: Proper data serialization and validation
- ⚡ **Efficient**: Optimized database queries with proper indexing
- 🧪 **Well Tested**: Comprehensive test coverage (coming soon)

## 📦 Installation

```bash
npm install baileys-session-manager-mongodb
# or
yarn add baileys-session-manager-mongodb
# or
pnpm add baileys-session-manager-mongodb
```

### Peer Dependencies

Make sure you have Baileys installed:

```bash
npm install @whiskeysockets/baileys
```

## 🚀 Quick Start

### Basic Usage

```typescript
import makeWASocket, { DisconnectReason, useMultiFileAuthState } from '@whiskeysockets/baileys';
import { useMongoAuthState } from 'baileys-session-manager-mongodb';

async function connectToWhatsApp() {
  // Initialize MongoDB session manager
  const { state, saveCreds } = await useMongoAuthState(
    'mongodb://localhost:27017/whatsapp', // MongoDB URI
    {
      session: 'my-whatsapp-session' // Unique session identifier
    }
  );

  // Create WhatsApp socket
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
    // ... other Baileys options
  });

  // Save credentials when updated
  sock.ev.on('creds.update', saveCreds);

  // Handle connection updates
  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    
    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect?.error as any)?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('Connection closed due to:', lastDisconnect?.error, 'Reconnecting:', shouldReconnect);
      
      if (shouldReconnect) {
        connectToWhatsApp();
      }
    } else if (connection === 'open') {
      console.log('WhatsApp connection opened');
    }
  });
}

connectToWhatsApp();
```

### Advanced Configuration

```typescript
import { useMongoAuthState, MongoConfig } from 'baileys-session-manager-mongodb';

const config: MongoConfig = {
  session: 'advanced-session',
  collectionName: 'whatsapp_sessions', // Custom collection name
  retryRequestDelayMs: 500,            // Retry delay (default: 200ms)
  maxRetries: 15,                      // Max retry attempts (default: 10)
  debug: true,                         // Enable debug logging
  mongoOptions: {                      // Additional MongoDB options
    maxPoolSize: 20,
    serverSelectionTimeoutMS: 10000,
  }
};

const { state, saveCreds, clear, removeCreds, disconnect } = await useMongoAuthState(
  'mongodb://username:password@cluster.mongodb.net/database',
  config
);

// Clear session data (keeps credentials)
await clear();

// Remove all session data including credentials
await removeCreds();

// Disconnect from MongoDB when done
await disconnect();
```

### Multiple Sessions

```typescript
// Session 1
const session1 = await useMongoAuthState('mongodb://localhost:27017/whatsapp', {
  session: 'user-session-1'
});

// Session 2
const session2 = await useMongoAuthState('mongodb://localhost:27017/whatsapp', {
  session: 'user-session-2'
});

// Each session is completely isolated
const sock1 = makeWASocket({ auth: session1.state });
const sock2 = makeWASocket({ auth: session2.state });
```

## 📚 API Reference

### useMongoAuthState(mongoURI, config)

Creates a MongoDB authentication state manager.

#### Parameters

- `mongoURI` (string): MongoDB connection URI
- `config` (MongoConfig): Configuration options

#### Returns

Promise resolving to an object with:

- `state` (AuthenticationState): Baileys authentication state
- `saveCreds` (() => Promise<void>): Function to save credentials
- `clear` (() => Promise<void>): Function to clear session data (keeps credentials)
- `removeCreds` (() => Promise<void>): Function to remove all session data
- `query` ((collection: string, docId: string) => Promise<MongoSessionDocument | null>): Custom query function
- `disconnect` (() => Promise<void>): Function to disconnect from MongoDB

### MongoConfig Interface

```typescript
interface MongoConfig {
  /** Session identifier for multi-session support */
  session: string;
  
  /** MongoDB collection name (default: 'baileys-auth') */
  collectionName?: string;
  
  /** Retry delay in milliseconds (default: 200) */
  retryRequestDelayMs?: number;
  
  /** Maximum retry attempts (default: 10) */
  maxRetries?: number;
  
  /** Additional MongoDB connection options */
  mongoOptions?: mongoose.ConnectOptions;
  
  /** Enable debug logging (default: false) */
  debug?: boolean;
}
```

### MongoSessionManager Class

For advanced usage, you can use the `MongoSessionManager` class directly:

```typescript
import { MongoSessionManager } from 'baileys-session-manager-mongodb';

const manager = new MongoSessionManager('mongodb://localhost:27017/whatsapp', {
  session: 'my-session'
});

const authState = await manager.getAuthState();
await manager.saveCredentials(authState.creds);
await manager.clearSessionData();
await manager.disconnect();
```

## 🛠️ Development

### Building

```bash
npm run build
```

### Linting

```bash
npm run lint
npm run lint:fix
```

### Formatting

```bash
npm run format
npm run format:check
```

### Documentation

```bash
npm run docs
```

## 📝 Error Handling

The library provides comprehensive error handling with specific error types:

```typescript
import { 
  SessionValidationError, 
  MongoConnectionError 
} from 'baileys-session-manager-mongodb';

try {
  const { state } = await useMongoAuthState(mongoURI, config);
} catch (error) {
  if (error instanceof MongoConnectionError) {
    console.error('MongoDB connection failed:', error.message);
  } else if (error instanceof SessionValidationError) {
    console.error('Session validation failed:', error.message);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## 🔧 Environment Variables

You can use environment variables for configuration:

```bash
MONGODB_URI=mongodb://localhost:27017/whatsapp
WHATSAPP_SESSION_ID=my-session
DEBUG_BAILEYS_SESSION=true
```

```typescript
const { state, saveCreds } = await useMongoAuthState(
  process.env.MONGODB_URI!,
  {
    session: process.env.WHATSAPP_SESSION_ID!,
    debug: process.env.DEBUG_BAILEYS_SESSION === 'true'
  }
);
```

## 📊 Database Schema

The library creates documents with the following structure:

```javascript
{
  "_id": "session-name-data-type-id",
  "value": "...", // Serialized data
  "session": "session-name",
  "createdAt": ISODate("..."),
  "updatedAt": ISODate("...")
}
```

Indexes are automatically created for efficient querying:
- `{ session: 1, _id: 1 }` (compound index)
- `{ _id: 1 }` (unique index)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Baileys](https://github.com/WhiskeySockets/Baileys) - WhatsApp Web API library
- [Mongoose](https://mongoosejs.com/) - MongoDB object modeling for Node.js
- [libsignal](https://github.com/signalapp/libsignal) - Signal Protocol implementation

## 📞 Support

If you encounter any issues or have questions:

1. Check the [documentation](#-api-reference)
2. Search [existing issues](https://github.com/yourusername/baileys-session-manager-mongodb/issues)
3. Create a [new issue](https://github.com/yourusername/baileys-session-manager-mongodb/issues/new) with detailed information

## 🔮 Roadmap

- [ ] Unit and integration tests
- [ ] Performance benchmarks
- [ ] Migration utilities
- [ ] Session backup/restore functionality
- [ ] Metrics and monitoring support
- [ ] Clustering support

---

Made with ❤️ by [Eshan Chathuranga](https://github.com/yourusername)