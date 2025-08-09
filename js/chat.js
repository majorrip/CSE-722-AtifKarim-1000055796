// Basic variables to store client info and keys
window.clientId = '';
window.targetClientId = '';
window.publicKeys = {};
window.aesKey = null;
window.pollingInterval = null;
window.lastFetchedMessages = [];

const chatWindow = document.getElementById('chatWindow');
const debugLog = document.getElementById('debugLog');

function logDebug(msg) {
  const timestamp = new Date().toLocaleTimeString();
  debugLog.innerHTML += `[${timestamp}] ${msg}<br>`;
  debugLog.scrollTop = debugLog.scrollHeight;
}

function logChatSystem(msg) {
  const timestamp = new Date().toLocaleTimeString();
  chatWindow.innerHTML += `<div><b>[${timestamp}] [System]</b> ${msg}</div>`;
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

// Connect button sets client IDs and starts polling
document.getElementById('connectBtn').onclick = () => {
  window.clientId = document.getElementById('clientId').value.trim();
  window.targetClientId = document.getElementById('targetId').value.trim();

  if (!window.clientId || !window.targetClientId) {
    alert('Please enter both Client ID and Target Client ID');
    return;
  }

  document.getElementById('chatArea').style.display = 'block';
  logChatSystem(`Connection established between "${window.clientId}" and "${window.targetClientId}".`);
  logDebug('Connected! You can start chatting.');
  startPolling();
};

// Send plaintext message
document.getElementById('sendBtn').onclick = () => {
  const msg = document.getElementById('messageInput').value.trim();
  if (!msg) return;

  sendMessage(msg, 'plaintext_message');
  document.getElementById('messageInput').value = '';
};

// Exchange public keys (generate and send own public key)
document.getElementById('exchangePublicKeysBtn').onclick = async () => {
  if (!window.clientId || !window.targetClientId) {
    alert('Set client IDs first');
    return;
  }
  logDebug('Generating RSA key pair...');
  const keyPair = await window.crypto.subtle.generateKey(
    { name: "RSA-OAEP", modulusLength: 2048, publicExponent: new Uint8Array([1,0,1]), hash: "SHA-256" },
    true,
    ["encrypt", "decrypt"]
  );
  window.rsaKeyPair = keyPair;

  // Export public key
  const spki = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);
  const base64PublicKey = arrayBufferToBase64(spki);
  window.publicKeys[window.clientId] = base64PublicKey;

  // Send public key to other client
  sendKey('public_key', base64PublicKey).then(success => {
    if(success){
      logChatSystem(`Public key sent by "${window.clientId}": ${base64PublicKey}`);
    }
  });
};

// Send AES key encrypted with target's public key
document.getElementById('exchangeAESKeyBtn').onclick = async () => {
  if (!window.publicKeys[window.clientId] || !window.publicKeys[window.targetClientId]) {
    logDebug('You need to exchange public keys first!');
    return;
  }

  if (!window.aesKey) {
    // Generate AES-256 key
    window.aesKey = await window.crypto.subtle.generateKey(
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );
  }

  // Export AES key raw format
  const rawAesKey = await window.crypto.subtle.exportKey('raw', window.aesKey);
  const base64AesKey = arrayBufferToBase64(rawAesKey);

  // Encrypt AES key with target's RSA public key
  const targetPublicKeyBase64 = window.publicKeys[window.targetClientId];
  const targetPublicKey = await importPublicKey(targetPublicKeyBase64);

  const encryptedAesKeyBuffer = await window.crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    targetPublicKey,
    new TextEncoder().encode(base64AesKey)
  );
  const encryptedAesKeyBase64 = arrayBufferToBase64(encryptedAesKeyBuffer);

  // Send encrypted AES key to server with correct type
  fetch('send.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'encrypted_aes_key',
      clientId: window.clientId,
      targetId: window.targetClientId,
      content: encryptedAesKeyBase64
    })
  }).then(res => res.json())
    .then(data => {
      if (data.status === 'success') {
        logChatSystem(`AES key sent by "${window.clientId}" to "${window.targetClientId}": ${encryptedAesKeyBase64}`);
      } else {
        logDebug('Failed to send AES key: ' + data.message);
      }
    }).catch(err => {
      logDebug('Error sending AES key: ' + err);
    });
};

// Helper: send plaintext or public key to server
function sendMessage(msg, type) {
  let content = msg;
  if (type === 'encrypted_message' && window.aesKey) {
    // Encrypt with AES (not implemented here, placeholder)
    logDebug('Encrypting message with AES key (not implemented)');
  }
  fetch('send.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: type,
      clientId: window.clientId,
      targetId: window.targetClientId,
      content: content
    })
  }).then(res => res.json())
    .then(data => {
      if (data.status === 'success') {
        logDebug('Message sent.');
      } else {
        logDebug('Failed to send message: ' + data.message);
      }
    }).catch(err => {
      logDebug('Error sending message: ' + err);
    });
}

// Helper: send keys
async function sendKey(type, keyContent) {
  try {
    const res = await fetch('send.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: type,
        clientId: window.clientId,
        targetId: window.targetClientId,
        content: keyContent
      })
    });
    const data = await res.json();
    if (data.status === 'success') {
      logDebug(`${type} sent.`);
      return true;
    } else {
      logDebug(`Failed to send ${type}: ` + data.message);
      return false;
    }
  } catch (err) {
    logDebug(`Error sending ${type}: ` + err);
    return false;
  }
}

// Poll for new messages and keys every 2 seconds
function startPolling() {
  if (window.pollingInterval) clearInterval(window.pollingInterval);

  window.pollingInterval = setInterval(() => {
    fetch(`poll.php?clientId=${encodeURIComponent(window.clientId)}`)
      .then(res => res.json())
      .then(data => {
        if (data.status !== 'success') {
          logDebug('Polling error: ' + data.message);
          return;
        }

        logDebug('Polling complete. Messages fetched: ' + data.messages.length);

        data.messages.forEach(msg => {
          const key = msg.timestamp + msg.sender + msg.content + msg.type;
          if (!window.lastFetchedMessages.includes(key)) {
            window.lastFetchedMessages.push(key);

            // DEBUG: Log entire message for inspection
            console.log("Polled message:", msg);

            // Handle plaintext and encrypted messages normally
            if (msg.type === 'plaintext_message' || msg.type === 'encrypted_message') {
              displayMessage(msg);
            } 
            // Handle public key messages
            else if (msg.type === 'public_key') {
              if (msg.sender === window.clientId) {
                // I sent it
                logChatSystem(`Public key sent by "${msg.sender}": ${msg.content}`);
              } else {
                // I received it (receiver is this client)
                logChatSystem(`Public key received from "${msg.sender}": ${msg.content}`);
                window.publicKeys[msg.sender] = msg.content;
              }
            } 
            // Handle AES key messages
            else if (msg.type === 'encrypted_aes_key') {
              if (msg.sender === window.clientId) {
                const receiver = msg.receiver || window.targetClientId;
                logChatSystem(`AES key sent by "${msg.sender}" to "${receiver}": ${msg.content}`);
              } else {
                logChatSystem(`AES key received from "${msg.sender}": ${msg.content}`);
              }
            } else {
              // Other messages
              displayMessage(msg);
            }
          }
        });

        // Update keys cache
        window.publicKeys = data.publicKeys || {};
        if (!data.aesKeys) data.aesKeys = {};

      }).catch(err => {
        logDebug('Polling fetch error: ' + err);
      });
  }, 2000);
}

// Show message in chat window
function displayMessage(msg) {
  const time = new Date(msg.timestamp * 1000).toLocaleTimeString();
  const sender = msg.sender;
  const content = msg.content;
  chatWindow.innerHTML += `<div><b>[${time}] ${sender}:</b> ${content}</div>`;
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

// Utility: ArrayBuffer to Base64
function arrayBufferToBase64(buffer) {
  let binary = '';
  let bytes = new Uint8Array(buffer);
  for (let b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

// Utility: Base64 to ArrayBuffer
function base64ToArrayBuffer(base64) {
  let binary = atob(base64);
  let bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Import RSA public key from base64 SPKI
async function importPublicKey(base64) {
  const spki = base64ToArrayBuffer(base64);
  return await window.crypto.subtle.importKey(
    "spki",
    spki,
    {
      name: "RSA-OAEP",
      hash: "SHA-256"
    },
    true,
    ["encrypt"]
  );
}
