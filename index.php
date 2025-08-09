<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Encrypted Chat App</title>
<link rel="stylesheet" href="css/style.css" />
</head>
<body>
  <h2>Encrypted Chat App</h2>
  
  <div>
    Your Client ID: <input type="text" id="clientId" placeholder="e.g. Client1" /><br>
    Target Client ID: <input type="text" id="targetId" placeholder="e.g. Client2" /><br>
    <button id="connectBtn">Connect</button>
  </div>
  
  <div id="chatArea" style="display:none;">
    <div id="chatWindow" style="border:1px solid #ccc; height:300px; overflow-y:auto; padding:5px; margin-top:10px;"></div>

    <input type="text" id="messageInput" placeholder="Type a message..." />
    <button id="sendBtn">Send Message</button>

    <hr/>

    <button id="exchangePublicKeysBtn">Exchange Public Keys</button>
    <button id="exchangeAESKeyBtn">Send AES Key</button>

    <hr/>

    <div id="debugLog" style="height:150px; overflow-y:auto; background:#f0f0f0; font-family: monospace; font-size:12px; padding:5px;"></div>
  </div>

<script src="js/chat.js"></script>
</body>
</html>