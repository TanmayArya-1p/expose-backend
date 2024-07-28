const { model } = require("mongoose");
const crypto = require("crypto");

async function generateKeyPair() {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256"
    },
    true,
    ["encrypt", "decrypt"]
  );

  const publicKeyBuffer = await crypto.subtle.exportKey("spki", keyPair.publicKey);
  const privateKeyBuffer = await crypto.subtle.exportKey("pkcs8", keyPair.privateKey);

  const publicKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(publicKeyBuffer)));
  const privateKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(privateKeyBuffer)));

  return {
    publicKey: publicKeyBase64,
    privateKey: privateKeyBase64
  };
}

async function verifyMessage(publicKey, message, signature) {
  const verify = crypto.createVerify('RSA-SHA256');
  verify.update(message);
  verify.end();
  const isValid = verify.verify(publicKey, signature, 'base64');
  return isValid;
}


async function signMessage(privateKeyString, message) {
  const privateKeyBuffer = Uint8Array.from(atob(privateKeyString), c => c.charCodeAt(0)).buffer;
  const privateKey = await crypto.subtle.importKey(
    "pkcs8",
    privateKeyBuffer,
    {
      name: "RSA-PSS",
      hash: "SHA-256"
    },
    true,
    ["sign"]
  );

  const encodedMessage = new TextEncoder().encode(message);
  const signature = await crypto.subtle.sign(
    {
      name: "RSA-PSS",
      saltLength: 32
    },
    privateKey,
    encodedMessage
  );

  return btoa(String.fromCharCode(...new Uint8Array(signature))); // Convert ArrayBuffer to Base64 string
}



module.exports = {generateKeyPair , signMessage, verifyMessage}