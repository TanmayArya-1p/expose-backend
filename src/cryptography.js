const { model } = require("mongoose");

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

async function verifyMessage(publicKeyString, message, signature) {
  const publicKeyBuffer = Uint8Array.from(atob(publicKeyString), c => c.charCodeAt(0)).buffer;
  const publicKey = await crypto.subtle.importKey(
    "spki",
    publicKeyBuffer,
    {
      name: "RSA-PSS",
      hash: "SHA-256"
    },
    true,
    ["verify"]
  );

  const encodedMessage = new TextEncoder().encode(message);
  let signatureBuffer =null
  try{
    signatureBuffer = Uint8Array.from(atob(signature), c => c.charCodeAt(0)).buffer;
  }
  catch(e){
    console.error("HARD AUTH ERROR",e);
    return false;
  }

  const isValid = await crypto.subtle.verify(
    {
      name: "RSA-PSS",
      saltLength: 32
    },
    publicKey,
    signatureBuffer,
    encodedMessage
  );

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