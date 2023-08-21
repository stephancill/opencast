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
import { resolveUsersMap } from '../../../../lib/user/resolve-user';

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
      hash: Buffer.from(id, 'hex')
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
      signer: cast.messages.signer
    }
  });

  const engagements = await prisma.reactions.findMany({
    where: {
      target_hash: cast.hash,
      deleted_at: null
    },
    select: {
      fid: true,
      reaction_type: true
    }
  });

  // Group reactions by type
  const reactions = engagements.reduce((acc: any, cur) => {
    const key = cur.reaction_type;
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
  cast.mentions.forEach((mention) => fids.add(mention));

  const users = await resolveUsersMap([...fids]);

  let topic: TopicType | null = null;
  if (cast.parent_url) {
    topic = await resolveTopic(cast.parent_url);
  }

  let tweet: Tweet = tweetConverter.toTweet(cast);

  const tweetWithUsers: TweetWithUsers = {
    ...tweet,
    topic: topic,
    userLikes: reactions[ReactionType.LIKE] || [],
    userRetweets: reactions[ReactionType.RECAST] || [],
    users: users,
    client: signer?.name || null
  };

  res.json({
    result: tweetWithUsers
  });
}
