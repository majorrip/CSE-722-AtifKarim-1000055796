# Encrypted Chat Application

A simple encrypted chat application built with PHP backend and a JavaScript frontend using the Web Crypto API. It supports RSA public key exchange and AES-256 encrypted messaging between two clients.

## Features

- Establish connection between two clients by specifying client IDs.
- RSA key pair generation and secure public key exchange.
- AES-256 key generation and encrypted key exchange.
- Encrypted message sending and receiving using AES-GCM.
- Real-time polling for new messages and keys.
- Clear text and encrypted messaging modes.
- Responsive and modern UI.

## How to Run

1. Clone the repository.
2. Host the PHP files (`send.php`, `poll.php`, `storage.php`, `index.php`) on a PHP-enabled web server (e.g., Apache, XAMPP).
3. Open `index.php` in two different browsers or devices.
4. Enter unique Client IDs and each other’s Client IDs to connect.
5. Use the buttons to exchange public keys and AES keys.
6. Send plaintext or encrypted messages securely.

## Requirements

- PHP 7+
- Modern web browser with Web Crypto API support (Chrome, Firefox, Edge)

## Cryptographic Protocol

- RSA-OAEP with 2048-bit keys for public key encryption.
- AES-GCM with 256-bit keys for message encryption.
- Secure exchange of public keys and AES keys ensures confidentiality, integrity, and authenticity.

## Notes

- The app uses simple file-based JSON storage for demo purposes.
- Real-time communication is implemented via periodic polling.
- This is a prototype suitable for educational purposes.

## Author

- Atif Karim

## License

This project is licensed under the MIT License.
