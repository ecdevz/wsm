# 🚀 Quick Setup Guide

## Prerequisites

1. **Node.js** (version 16 or higher)
2. **npm** or **yarn**
3. **MongoDB** (local or cloud instance)
4. **Git** (for version control)

## Installation

```bash
npm install baileys-session-manager-mongodb
```

## Quick Start

```typescript
import { MongoSessionManager } from 'baileys-session-manager-mongodb';
import makeWASocket, { DisconnectReason } from '@whiskeysockets/baileys';

// Initialize session manager
const sessionManager = new MongoSessionManager({
    mongoUrl: 'mongodb://localhost:27017',
    dbName: 'whatsapp_sessions',
    collectionName: 'sessions'
});

// Create WhatsApp connection
const sock = makeWASocket({
    auth: {
        creds: await sessionManager.getCreds(),
        keys: await sessionManager.getKeys()
    },
    // ... other options
});

// Listen for auth updates
sock.ev.on('creds.update', sessionManager.saveCreds);
sock.ev.on('keys.update', sessionManager.saveKeys);
```

## Environment Variables

Create a `.env` file in your project root:

```env
# MongoDB Configuration
MONGODB_URL=mongodb://localhost:27017
MONGODB_DB_NAME=whatsapp_sessions
MONGODB_COLLECTION_NAME=sessions

# Session Configuration (optional)
SESSION_ID=default
ENCRYPTION_KEY=your-32-character-encryption-key-here
```

## Development Setup

If you want to contribute or modify this package:

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/baileys-session-manager-mongodb.git
cd baileys-session-manager-mongodb
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Development Environment

```bash
# Install peer dependencies for development
npm install --save-dev @types/qrcode baileys qrcode

# Copy example environment file
cp .env.example .env
```

### 4. Build and Test

```bash
# Build the project
npm run build

# Run tests
npm run test

# Run linting
npm run lint

# Format code
npm run format

# Validate everything
npm run validate
```

### 5. Development Commands

```bash
# Watch mode for development
npm run dev

# Run tests in watch mode
npm run test:watch

# Generate documentation
npm run docs

# Serve documentation
npm run docs:serve
```

## Production Deployment

### Using GitHub Actions (Recommended)

1. **Set up NPM Token:**
   ```bash
   # Go to npmjs.com → Access Tokens → Generate New Token
   # Add NPM_TOKEN to GitHub repository secrets
   ```

2. **Create a Release:**
   ```bash
   # Use the local release helper
   npm run release:local
   
   # Or manually
   npm version patch  # or minor/major
   git push origin main --tags
   ```

3. **GitHub Actions will automatically:**
   - Run tests on multiple Node.js versions
   - Build the project
   - Publish to NPM when you create a GitHub release

### Manual Deployment

```bash
# Validate before publishing
npm run validate

# Dry run to test
npm run publish:dry

# Publish to npm
npm publish
```

## Examples

Check the `examples/` directory for complete usage examples:

- **Basic Usage:** Simple WhatsApp bot setup
- **Multi-Session:** Managing multiple WhatsApp accounts
- **Advanced Features:** Encryption, retry logic, error handling

## Troubleshooting

### Common Issues

1. **MongoDB Connection Failed:**
   ```bash
   # Make sure MongoDB is running
   mongod --version
   # Check your connection string
   ```

2. **Build Errors:**
   ```bash
   # Clean and rebuild
   npm run clean
   npm run build
   ```

3. **TypeScript Errors:**
   ```bash
   # Check TypeScript version
   npx tsc --version
   # Update types
   npm update @types/node
   ```

### Getting Help

- 📖 **Documentation:** Check the `docs/` folder
- 🐛 **Issues:** [GitHub Issues](https://github.com/yourusername/baileys-session-manager-mongodb/issues)
- 💬 **Discussions:** [GitHub Discussions](https://github.com/yourusername/baileys-session-manager-mongodb/discussions)

## Next Steps

1. ✅ **Follow the Quick Start** guide above
2. 📖 **Read the Documentation** in the `docs/` folder
3. 🔍 **Check Examples** in the `examples/` folder
4. 🚀 **Build Something Awesome!**

---

Happy coding! 🎉