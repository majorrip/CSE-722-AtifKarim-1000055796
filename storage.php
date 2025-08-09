<?php
// storage.php - Helper functions for JSON file read/write

function readJson($filename) {
    if (!file_exists($filename)) return [];
    $json = file_get_contents($filename);
    return json_decode($json, true) ?: [];
}

function writeJson($filename, $data) {
    file_put_contents($filename, json_encode($data, JSON_PRETTY_PRINT));
}