<?php
// send.php - Receive JSON POST with message/key data and save to JSON files

header('Content-Type: application/json');
$data = json_decode(file_get_contents('php://input'), true);

if (!$data) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid JSON']);
    exit;
}

$type = $data['type'] ?? '';
$clientId = $data['clientId'] ?? '';
$targetId = $data['targetId'] ?? '';
$content = $data['content'] ?? '';

if (!$type || !$clientId || !$targetId || !$content) {
    echo json_encode(['status' => 'error', 'message' => 'Missing fields']);
    exit;
}

function readJson($filename) {
    if (!file_exists($filename)) return [];
    $json = file_get_contents($filename);
    return json_decode($json, true) ?: [];
}

function writeJson($filename, $data) {
    file_put_contents($filename, json_encode($data, JSON_PRETTY_PRINT));
}

if ($type === 'plaintext_message' || $type === 'encrypted_message') {
    $messages = readJson('messages.json');
    $messages[] = [
        'timestamp' => time(),
        'sender' => $clientId,
        'receiver' => $targetId,
        'type' => $type,
        'content' => $content
    ];
    writeJson('messages.json', $messages);
} elseif ($type === 'public_key') {
    $keys = readJson('keys.json');
    $keys[$clientId] = $content;
    writeJson('keys.json', $keys);

    // Add system message for sender (confirmation of sending)
    $messages = readJson('messages.json');
    $messages[] = [
        'timestamp' => time(),
        'sender' => 'System',
        'receiver' => $clientId,
        'type' => 'system_message',
        'content' => "$clientId sent their public key: $content"
    ];

    // Add system message for receiver (confirmation of receiving)
    $messages[] = [
        'timestamp' => time(),
        'sender' => 'System',
        'receiver' => $targetId,
        'type' => 'system_message',
        'content' => "Public key received from $clientId: $content"
    ];

    writeJson('messages.json', $messages);
} elseif ($type === 'encrypted_aes_key') {
    $aesKeys = readJson('aes_keys.json');
    $aesKeys[$targetId] = $content;
    writeJson('aes_keys.json', $aesKeys);

    // Add system message for sender
    $messages = readJson('messages.json');
    $messages[] = [
        'timestamp' => time(),
        'sender' => 'System',
        'receiver' => $clientId,
        'type' => 'system_message',
        'content' => "$clientId sent AES key to $targetId: $content"
    ];

    // Add system message for receiver
    $messages[] = [
        'timestamp' => time(),
        'sender' => 'System',
        'receiver' => $targetId,
        'type' => 'system_message',
        'content' => "AES key received from $clientId: $content"
    ];

    writeJson('messages.json', $messages);
} else {
    echo json_encode(['status' => 'error', 'message' => 'Unknown type']);
    exit;
}

echo json_encode(['status' => 'success']);
