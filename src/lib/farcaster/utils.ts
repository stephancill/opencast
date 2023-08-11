import {
  FarcasterNetwork,
  makeReactionAdd,
  makeReactionRemove,
  Message,
  NobleEd25519Signer,
  ReactionType
} from '@farcaster/hub-web';

export async function createLikeMessage({
  castHash,
  castAuthorFid,
  type,
  fid,
  privateKey
}: {
  castHash: string;
  castAuthorFid: number;
  type: 'like' | 'unlike';
  fid: number;
  privateKey: string;
}) {
  console.log({ castHash, castAuthorFid, type, fid, privateKey });

  const messageDataOptions = {
    fid,
    network: FarcasterNetwork.MAINNET
  };

  const ed25519Signer = new NobleEd25519Signer(Buffer.from(privateKey, 'hex'));

  const maker = type === 'like' ? makeReactionAdd : makeReactionRemove;

  const message = await maker(
    {
      type: ReactionType.LIKE,
      targetCastId: {
        hash: new Uint8Array(Buffer.from(castHash, 'hex')),
        fid: castAuthorFid
      }
    },
    messageDataOptions,
    ed25519Signer
  );

  console.log(message);

  return message.unwrapOr(null);
}

export async function submitHubMessage(message: Message) {
  console.log(message);
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
