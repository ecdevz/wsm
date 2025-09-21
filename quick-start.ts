/**
 * Quick Start Example
 * 
 * This file demonstrates the basic usage of baileys-session-manager-mongodb
 * Copy this code to get started quickly with your WhatsApp bot.
 */

import makeWASocket, { DisconnectReason } from 'baileys';
import { useMongoAuthState } from 'baileys-session-manager-mongodb';
import QRCode from 'qrcode'

async function createWhatsAppBot() {
  // Initialize session manager
  const { state, saveCreds } = await useMongoAuthState(
    'mongodb+srv://mirakalclient:00mirakal00client00sky7@mirakaldb.aeviabi.mongodb.net/',
    { session: 'my-session' }
  );

  // Create WhatsApp socket
  const sock = makeWASocket({
    auth: state as any, // Type assertion for compatibility
    printQRInTerminal: true
  });

  // Handle credential updates
  sock.ev.on('creds.update', saveCreds);

  // Handle connection updates
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      // as an example, this prints the qr code to the terminal
      console.log(await QRCode.toString(qr, { type: 'terminal', small: true }));
    }

    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect?.error as any)?.output?.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) createWhatsAppBot();
    } else if (connection === 'open') {
      console.log('Connected to WhatsApp!');
    }
  });

  // Handle messages
  sock.ev.on('messages.upsert', async ({ messages }) => {
    for (const msg of messages) {
      if (!msg.key.fromMe && msg.message) {
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text;
        if (text === 'ping') {
          await sock.sendMessage(msg.key.remoteJid!, { text: 'pong' });
        }
      }
    }
  });
}

createWhatsAppBot().catch(console.error);