/**
 * Basic WhatsApp Bot Example using Baileys Session Manager for MongoDB
 * 
 * This example demonstrates how to create a simple WhatsApp bot that:
 * - Connects to WhatsApp using QR code
 * - Stores session data in MongoDB
 * - Handles basic message events
 * - Automatically reconnects on disconnection
 */

import makeWASocket, { 
    DisconnectReason, 
    WAMessageKey, 
    WAMessage,
    ConnectionState 
} from 'baileys';
import { useMongoAuthState } from '../lib'; // Use 'baileys-session-manager-mongodb' in your project

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/whatsapp';
const SESSION_ID = process.env.SESSION_ID || 'my-whatsapp-bot';
const DEBUG = process.env.DEBUG === 'true';

/**
 * Main function to start the WhatsApp bot
 */
async function startWhatsAppBot() {
    console.log('🚀 Starting WhatsApp Bot...');
    
    try {
        // Initialize MongoDB session manager
        const { state, saveCreds, clear, disconnect } = await useMongoAuthState(MONGODB_URI, {
            session: SESSION_ID,
            debug: DEBUG,
            retryRequestDelayMs: 500,
            maxRetries: 15
        });

        console.log('📦 Session manager initialized');

        // Create WhatsApp socket
        const sock = makeWASocket({
            auth: state as any, // Type assertion for compatibility
            printQRInTerminal: true,
            generateHighQualityLinkPreview: true,
            syncFullHistory: false,
            markOnlineOnConnect: true,
        });

        console.log('🔌 WhatsApp socket created');

        // Handle authentication updates
        sock.ev.on('creds.update', async () => {
            try {
                await saveCreds();
                if (DEBUG) console.log('💾 Credentials saved');
            } catch (error) {
                console.error('❌ Failed to save credentials:', error);
            }
        });

        // Handle connection updates
        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                console.log('📱 QR Code received, scan it with your WhatsApp app');
            }

            if (connection === 'close') {
                const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
                const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
                
                console.log('🔌 Connection closed due to:', lastDisconnect?.error);
                console.log('🔄 Reconnecting:', shouldReconnect);

                if (shouldReconnect) {
                    setTimeout(() => startWhatsAppBot(), 3000);
                } else {
                    console.log('👋 Logged out, cleaning up...');
                    await clear();
                    await disconnect();
                    process.exit(0);
                }
            } else if (connection === 'open') {
                console.log('✅ WhatsApp connection opened successfully!');
                console.log('📱 Bot is ready to receive messages');
                
                // Send a test message to yourself (optional)
                const jid = sock.user?.id;
                if (jid) {
                    try {
                        await sock.sendMessage(jid, { 
                            text: '🤖 Bot is now online and ready!' 
                        });
                    } catch (error) {
                        console.log('Could not send startup message:', error);
                    }
                }
            } else if (connection === 'connecting') {
                console.log('🔄 Connecting to WhatsApp...');
            }
        });

        // Handle incoming messages
        sock.ev.on('messages.upsert', async (messageUpdate) => {
            const { messages } = messageUpdate;

            for (const message of messages) {
                // Skip messages from self and status updates
                if (message.key.fromMe || message.key.remoteJid === 'status@broadcast') {
                    continue;
                }

                await handleIncomingMessage(sock, message);
            }
        });

        // Handle message deletions
        sock.ev.on('messages.delete', (deleteInfo) => {
            if (DEBUG) {
                console.log('🗑️ Messages deleted:', deleteInfo);
            }
        });

        // Handle presence updates
        sock.ev.on('presence.update', (presence) => {
            if (DEBUG) {
                console.log('👀 Presence update:', presence);
            }
        });

        // Graceful shutdown
        process.on('SIGINT', async () => {
            console.log('\n🛑 Shutting down bot...');
            await disconnect();
            process.exit(0);
        });

        process.on('SIGTERM', async () => {
            console.log('\n🛑 Shutting down bot...');
            await disconnect();
            process.exit(0);
        });

    } catch (error) {
        console.error('❌ Failed to start WhatsApp bot:', error);
        process.exit(1);
    }
}

/**
 * Handle incoming messages
 */
async function handleIncomingMessage(sock: any, message: WAMessage) {
    try {
        const messageText = message.message?.conversation || 
                           message.message?.extendedTextMessage?.text || 
                           '';

        const senderJid = message.key.remoteJid;
        const senderName = message.pushName || 'Unknown';

        if (!messageText.trim() || !senderJid) {
            return;
        }

        console.log(`📨 Message from ${senderName} (${senderJid}): ${messageText}`);

        // Simple command handling
        const command = messageText.toLowerCase().trim();

        switch (command) {
            case '/ping':
                await sock.sendMessage(senderJid, { 
                    text: '🏓 Pong! Bot is working correctly.' 
                });
                break;

            case '/time':
                await sock.sendMessage(senderJid, { 
                    text: `🕐 Current time: ${new Date().toLocaleString()}` 
                });
                break;

            case '/help':
                const helpText = `
🤖 *WhatsApp Bot Commands*

/ping - Check if bot is working
/time - Get current time
/help - Show this help message
/about - About this bot

Just send any message and I'll echo it back!
                `.trim();

                await sock.sendMessage(senderJid, { 
                    text: helpText 
                });
                break;

            case '/about':
                const aboutText = `
🤖 *WhatsApp Bot Information*

This bot is powered by:
• Baileys WhatsApp Web API
• MongoDB Session Manager
• Node.js & TypeScript

Repository: https://github.com/ecdevz/wsm
                `.trim();

                await sock.sendMessage(senderJid, { 
                    text: aboutText 
                });
                break;

            default:
                // Echo back the message
                await sock.sendMessage(senderJid, { 
                    text: `📝 You said: "${messageText}"` 
                });
                break;
        }

    } catch (error) {
        console.error('❌ Error handling message:', error);
    }
}

/**
 * Start the bot
 */
if (require.main === module) {
    console.log('🤖 WhatsApp Bot Example');
    console.log('========================');
    startWhatsAppBot().catch(console.error);
}

export { startWhatsAppBot };