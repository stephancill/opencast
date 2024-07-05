import * as ed from '@noble/ed25519';
import { KeyPair } from './types/keypair';
import { bytesToHex } from 'viem';

export async function generateKeyPair(): Promise<KeyPair> {
  const privateKey = ed.utils.randomPrivateKey();
  const publicKey = await ed.getPublicKeyAsync(privateKey);

  return {
    publicKey: bytesToHex(publicKey),
    privateKey: bytesToHex(privateKey)
  };
}

export async function getKeyPair(privateKey: `0x${string}`): Promise<KeyPair> {
  const publicKey = await ed.getPublicKeyAsync(privateKey.slice(2));

  return {
    publicKey: bytesToHex(publicKey),
    privateKey
  };
}
