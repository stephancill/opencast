import {
  Embed,
  FarcasterNetwork,
  HashScheme,
  makeCastAdd,
  makeCastRemove,
  makeLinkAdd,
  makeLinkRemove,
  makeReactionAdd,
  makeReactionRemove,
  Message,
  MessageData,
  NobleEd25519Signer,
  ReactionType
} from '@farcaster/hub-web';
import { ed25519 } from '@noble/curves/ed25519';
import { blake3 } from '@noble/hashes/blake3';
import { Buffer } from 'buffer';
import { toHex } from 'viem';
import { getActiveKeyPair } from '../keys';

function getSigner(privateKey: string): NobleEd25519Signer {
  const ed25519Signer = new NobleEd25519Signer(Buffer.from(privateKey, 'hex'));
  return ed25519Signer;
}

async function getSignerFromStorage(): Promise<NobleEd25519Signer> {
  const keyPair = await getActiveKeyPair();
  const privateKey = keyPair?.privateKey.slice(2);

  if (!privateKey) throw new Error('No signer found');

  return getSigner(privateKey);
}

export async function createReactionMessage({
  castHash,
  castAuthorFid,
  type,
  remove,
  fid
}: {
  castHash: string;
  castAuthorFid: number;
  type: ReactionType;
  remove?: boolean;
  fid: number;
}) {
  const signer = await getSignerFromStorage();

  const messageDataOptions = {
    fid,
    network: FarcasterNetwork.MAINNET
  };

  const maker = remove ? makeReactionRemove : makeReactionAdd;

  const message = await maker(
    {
      type,
      targetCastId: {
        hash: new Uint8Array(Buffer.from(castHash, 'hex')),
        fid: castAuthorFid
      }
    },
    messageDataOptions,
    signer
  );

  return message.unwrapOr(null);
}

export async function createCastMessage({
  text,
  embeds,
  parentCastHash,
  parentCastFid,
  parentUrl,
  mentions,
  mentionsPositions,
  fid
}: {
  text: string;
  embeds?: Embed[];
  parentCastHash?: string;
  parentCastFid?: number;
  parentUrl?: string;
  mentions?: number[];
  mentionsPositions?: number[];
  fid: number;
}) {
  const signer = await getSignerFromStorage();

  const messageDataOptions = {
    fid,
    network: FarcasterNetwork.MAINNET
  };

  const parentCastId =
    parentCastHash && parentCastFid
      ? {
          hash: new Uint8Array(Buffer.from(parentCastHash, 'hex')),
          fid: parentCastFid
        }
      : undefined;

  const message = await makeCastAdd(
    {
      text,
      embeds: embeds || [],
      embedsDeprecated: [],
      mentions: mentions || [],
      mentionsPositions: mentionsPositions || [],
      parentCastId,
      parentUrl
    },
    messageDataOptions,
    signer
  );

  if (message.isErr()) {
    console.error(message.error);
  }

  return message.unwrapOr(null);
}

export async function createRemoveCastMessage({
  castHash,
  castAuthorFid
}: {
  castHash: string;
  castAuthorFid: number;
}) {
  const signer = await getSignerFromStorage();
  const messageDataOptions = {
    fid: castAuthorFid,
    network: FarcasterNetwork.MAINNET
  };
  const message = await makeCastRemove(
    {
      targetHash: new Uint8Array(Buffer.from(castHash, 'hex'))
    },
    messageDataOptions,
    signer
  );

  return message.unwrapOr(null);
}

export async function createFollowMessage({
  targetFid,
  fid,
  remove
}: {
  targetFid: number;
  fid: number;
  remove?: boolean;
}) {
  const signer = await getSignerFromStorage();
  const messageDataOptions = {
    fid: fid,
    network: FarcasterNetwork.MAINNET
  };

  const maker = remove ? makeLinkRemove : makeLinkAdd;

  const message = await maker(
    {
      type: 'follow',
      targetFid: targetFid
    },
    messageDataOptions,
    signer
  );

  return message.unwrapOr(null);
}

export async function makeMessage(messageData: MessageData) {
  const signer = await getSignerFromStorage();

  const dataBytes = MessageData.encode(messageData).finish();

  const hash = blake3(dataBytes, { dkLen: 20 });

  const signature = await signer.signMessageHash(hash);
  if (signature.isErr()) return null;

  const signerKey = await signer.getSignerKey();
  if (signerKey.isErr()) return null;

  const message = Message.create({
    data: messageData,
    hash,
    hashScheme: HashScheme.BLAKE3,
    signature: signature.value,
    signatureScheme: signer.scheme,
    signer: signerKey.value
  });

  return message;
}

export async function submitHubMessage(message: Message) {
  const res = await fetch('/api/hub', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ message: Message.toJSON(message) })
  });
  const { result: hubResult } = await res.json();
  return hubResult;
}

export async function batchSubmitHubMessages(messages: Message[]) {
  const res = await fetch('/api/hub/batch', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ messages: messages.map(Message.toJSON) })
  });
  return res.ok;
}

function base64ToBase64Url(base64: string): string {
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

export async function generateAuthToken(
  payload: Record<string, any>,
  fid: number,
  expirationSeconds: number = 300
): Promise<string> {
  const signer = await getSignerFromStorage();
  const keyPair = await getActiveKeyPair();

  if (!keyPair) throw new Error('No active key pair found');

  const header = {
    fid,
    type: 'app_key',
    key: keyPair.publicKey
  };

  const encodedHeader = base64ToBase64Url(
    Buffer.from(JSON.stringify(header)).toString('base64')
  );

  const fullPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + expirationSeconds
  };
  const encodedPayload = base64ToBase64Url(
    Buffer.from(JSON.stringify(fullPayload)).toString('base64')
  );

  const message = Buffer.from(`${encodedHeader}.${encodedPayload}`, 'utf-8');

  const signatureResult = await signer.signMessageHash(message);

  if (signatureResult.isErr()) throw new Error('Failed to sign message');

  const encodedSignature = base64ToBase64Url(
    Buffer.from(signatureResult.value).toString('base64')
  );

  const validate = ed25519.verify(
    signatureResult.value,
    message,
    Buffer.from(keyPair.publicKey.slice(2), 'hex')
  );

  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
}
