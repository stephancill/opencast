import {
  FarcasterNetwork,
  makeCastAdd,
  makeReactionAdd,
  makeReactionRemove,
  Message,
  NobleEd25519Signer,
  ReactionType
} from '@farcaster/hub-web';

function getSigner(): NobleEd25519Signer {
  const privateKey = JSON.parse(
    localStorage.getItem('keyPair') || '{}'
  ).privateKey;
  const ed25519Signer = new NobleEd25519Signer(Buffer.from(privateKey, 'hex'));
  return ed25519Signer;
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
  const signer = getSigner();

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
  parentCastHash,
  parentCastFid,
  parentUrl,
  fid
}: {
  text: string;
  parentCastHash?: string;
  parentCastFid?: number;
  parentUrl?: string;
  fid: number;
}) {
  const signer = getSigner();

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
      embeds: [],
      embedsDeprecated: [],
      mentions: [],
      mentionsPositions: [],
      parentCastId,
      parentUrl
    },
    messageDataOptions,
    signer
  );

  const unwrapped = message.unwrapOr(null);

  if (!unwrapped) throw new Error('Could not create message');

  return unwrapped;
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
