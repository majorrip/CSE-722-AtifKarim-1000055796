<?php
header('Content-Type: application/json');

$clientId = $_GET['clientId'] ?? '';

if (!$clientId) {
    echo json_encode(['status' => 'error', 'message' => 'Missing clientId']);
    exit;
}

function readJson($filename) {
    if (!file_exists($filename)) return [];
    $json = file_get_contents($filename);
    return json_decode($json, true) ?: [];
}

$messages = readJson('messages.json');
$keys = readJson('keys.json');
$aesKeys = readJson('aes_keys.json');

$filteredMessages = array_filter($messages, function($m) use ($clientId) {
    return $m['sender'] === $clientId || $m['receiver'] === $clientId;
});

echo json_encode([
    'status' => 'success',
    'messages' => array_values($filteredMessages),
    'publicKeys' => $keys,
    'aesKeys' => $aesKeys
]);