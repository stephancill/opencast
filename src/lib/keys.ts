import * as ed from '@noble/ed25519';
import { KeyPair } from './types/keypair';
import { bytesToHex } from 'viem';

export const KEYPAIRS_KEY = 'keys';
export const ACTIVE_KEYPAIR_KEY = 'activeKey';
export const PENDING_KEYPAIR_KEY = 'pendingKey';

export async function getKeyPairs() {
  const keysRaw = localStorage.getItem(KEYPAIRS_KEY) as string | null;
  const keys: `0x${string}`[] = keysRaw ? JSON.parse(keysRaw) : [];

  const keyPairs = await Promise.all(
    keys.map(async (privateKey) => ({
      publicKey: bytesToHex(await ed.getPublicKeyAsync(privateKey.slice(2))),
      privateKey
    }))
  );

  return keyPairs;
}

export function addKeyPair(keyPair: KeyPair) {
  const keyPairsRaw = localStorage.getItem(KEYPAIRS_KEY) as string | null;
  const keyPairs: `0x${string}`[] = keyPairsRaw ? JSON.parse(keyPairsRaw) : [];
  if (!keyPairs.find((kp) => kp === keyPair.privateKey)) {
    keyPairs.push(keyPair.privateKey);
    localStorage.setItem(KEYPAIRS_KEY, JSON.stringify(keyPairs));
  }
}

export function removeKeyPair(keyPair: KeyPair) {
  const keyPairsRaw = localStorage.getItem(KEYPAIRS_KEY) as string | null;
  const keyPairs: `0x${string}`[] = keyPairsRaw ? JSON.parse(keyPairsRaw) : [];
  const newKeyPairs = keyPairs.filter((kp) => kp !== keyPair.privateKey);
  localStorage.setItem(KEYPAIRS_KEY, JSON.stringify(newKeyPairs));
}

export function setKeyPair(keyPair: KeyPair) {
  localStorage.setItem(ACTIVE_KEYPAIR_KEY, keyPair.privateKey);
}

export async function getActiveKeyPair(): Promise<KeyPair | null> {
  const privateKey = localStorage.getItem(ACTIVE_KEYPAIR_KEY) as
    | `0x${string}`
    | null;

  if (!privateKey) {
    const keyPairs = await getKeyPairs();
    if (keyPairs.length > 0) {
      setKeyPair(keyPairs[0]);
      const keyPair = await getActiveKeyPair();
      return keyPair;
    } else {
      return null;
    }
  }

  const publicKey = await ed.getPublicKeyAsync(privateKey.slice(2));

  return {
    privateKey,
    publicKey: bytesToHex(publicKey)
  };
}
