import { ReactionType } from '@farcaster/hub-web';
import type { NextApiRequest, NextApiResponse } from 'next';
import { populateEmbed } from '../../../../lib/embeds';
import { prisma } from '../../../../lib/prisma';
import { resolveTopic } from '../../../../lib/topics/resolve-topic';
import { TopicType } from '../../../../lib/types/topic';
import {
  ExternalEmbed,
  Tweet,
  tweetConverter,
  TweetResponse,
  TweetWithUsers
} from '../../../../lib/types/tweet';
import {
  resolveUserFromFid,
  resolveUsersMap
} from '../../../../lib/user/resolve-user';
import { JsonObject } from '@prisma/client/runtime/library';

type TweetEndpointQuery = {
  id: string;
};

export default async function tweetIdEndpoint(
  req: NextApiRequest,
  res: NextApiResponse<TweetResponse>
): Promise<void> {
  const { id } = req.query as TweetEndpointQuery;

  const cast = await prisma.casts.findUnique({
    where: {
      hash: Buffer.from(id, 'hex'),
      deleted_at: null,
      messages: {
        deleted_at: null
      }
    },
    include: {
      messages: true
    }
  });

  if (!cast) {
    res.status(404).json({
      message: 'Cast not found'
    });
    return;
  }

  const signer = await prisma.signers.findFirst({
    where: {
      key: cast.messages.signer
    }
  });
  const clientFid =
    signer?.metadata_type === 1
      ? ((signer?.metadata as JsonObject | undefined)?.requestFid as string) ||
        null
      : null;
  const clientUser = clientFid
    ? await resolveUserFromFid(BigInt(clientFid))
    : null;

  const engagements = await prisma.reactions.findMany({
    where: {
      target_cast_hash: cast.hash,
      deleted_at: null
    },
    select: {
      fid: true,
      type: true
    }
  });

  // Group reactions by type
  const reactions = engagements.reduce((acc: any, cur) => {
    const key = cur.type;
    if (acc[key]) {
      acc[key] = [...acc[key], cur.fid.toString()];
    } else {
      acc[key] = [cur.fid.toString()];
    }
    return acc;
  }, {});

  // Get all fids from cast and mentions
  const fids = new Set<bigint>();
  fids.add(cast.fid);
  if (cast.parent_fid) fids.add(cast.parent_fid);
  (cast.mentions as number[]).forEach((mention) => fids.add(BigInt(mention)));

  const users = await resolveUsersMap([...fids]);

  let topic: TopicType | null = null;
  if (cast.root_parent_url) {
    topic = await resolveTopic(cast.root_parent_url);
  }

  let tweet: Tweet = tweetConverter.toTweet(cast);

  const tweetWithUsers: TweetWithUsers = {
    ...tweet,
    topic: topic,
    userLikes: reactions[ReactionType.LIKE] || [],
    userRetweets: reactions[ReactionType.RECAST] || [],
    users: users,
    client: clientUser?.name || null
  };

  res.json({
    result: tweetWithUsers
  });
}
