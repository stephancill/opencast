import {
  Embed,
  FarcasterNetwork,
  makeCastAdd,
  makeCastRemove,
  makeLinkAdd,
  makeLinkRemove,
  makeReactionAdd,
  makeReactionRemove,
  Message,
  NobleEd25519Signer,
  ReactionType
} from '@farcaster/hub-web';

function getSigner(privateKey: string): NobleEd25519Signer {
  const ed25519Signer = new NobleEd25519Signer(Buffer.from(privateKey, 'hex'));
  return ed25519Signer;
}

function getSignerFromStorage(key: string = 'keyPair'): NobleEd25519Signer {
  const privateKey = JSON.parse(localStorage.getItem(key) || '{}').privateKey;
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
  const signer = getSignerFromStorage();

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
  const signer = getSignerFromStorage();

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
  const signer = getSignerFromStorage();
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
  const signer = getSignerFromStorage();
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
