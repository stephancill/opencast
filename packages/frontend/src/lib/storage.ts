import { KeyPair } from './types/keypair';

export function getKeyPairs() {
  const keyPairsRaw = localStorage.getItem('keyPairs') as string | null;
  const keyPairs: KeyPair[] = keyPairsRaw ? JSON.parse(keyPairsRaw) : [];
  const filteredKeyPairs = keyPairs.filter(
    (kp) => kp && kp.publicKey && kp.privateKey
  );
  return filteredKeyPairs;
}

export function addKeyPair(keyPair: KeyPair) {
  if (!keyPair) {
    console.error('KeyPair is null');
    return;
  }
  const keyPairsRaw = localStorage.getItem('keyPairs') as string | null;
  const keyPairs: KeyPair[] = keyPairsRaw ? JSON.parse(keyPairsRaw) : [];
  keyPairs.push(keyPair);
  localStorage.setItem('keyPairs', JSON.stringify(keyPairs));
}

export function removeKeyPair(keyPair: KeyPair) {
  if (!keyPair) {
    console.error('KeyPair is null');
    return;
  }
  const keyPairsRaw = localStorage.getItem('keyPairs') as string | null;
  const keyPairs: KeyPair[] = keyPairsRaw ? JSON.parse(keyPairsRaw) : [];
  const newKeyPairs = keyPairs.filter(
    (kp) => kp.publicKey !== keyPair.publicKey
  );
  localStorage.setItem('keyPairs', JSON.stringify(newKeyPairs));
}

export function setKeyPair(keyPair: KeyPair) {
  if (!keyPair) {
    console.error('KeyPair is null');
    return;
  }
  localStorage.setItem('keyPair', JSON.stringify(keyPair));
}

export function getKeyPair() {
  const keyPairRaw = localStorage.getItem('keyPair') as string | null;
  const keyPair: KeyPair = keyPairRaw ? JSON.parse(keyPairRaw) : null;

  if (!keyPair) {
    const keyPairs = getKeyPairs();
    if (keyPairs.length > 0) {
      setKeyPair(keyPairs[0]!);
      return keyPairs[0]!;
    }
  }

  return keyPair;
}
