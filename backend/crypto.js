import crypto from 'node:crypto';
import dotenv from 'dotenv';
dotenv.config();

const secretKey = crypto.scryptSync(process.env.PASSWORD, 'salt', 32);
const iv = Buffer.alloc(16);

export function encryptMessage(message) {
    if (!message || message.length === 0) return message;

    const cipher = crypto.createCipheriv("aes-256-cbc", secretKey, iv);

    let encryptedMessage = cipher.update(message, "utf-8", "hex");
    encryptedMessage += cipher.final("hex");

    return encryptedMessage;
}

export function decryptMessage(message) {
    if (!message || message.length === 0) return message;
    
    try {
        const decipher = crypto.createDecipheriv("aes-256-cbc", secretKey, iv);

        let decryptedMessage = decipher.update(message, "hex", "utf-8");
        decryptedMessage += decipher.final("utf-8");

        return decryptedMessage;
    } catch (error) {
        console.error("Decryption error:", error);
        throw error;
    }
}