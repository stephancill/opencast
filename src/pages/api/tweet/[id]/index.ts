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
import { convertAndCalculateCursor } from '@lib/paginated-tweets';

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
      deleted_at: null
    }
  });

  if (!cast) {
    res.status(404).json({
      message: 'Cast not found'
    });
    return;
  }

  const { tweets, users } = await convertAndCalculateCursor([cast]);
  const tweet = tweets[0];

  // const signer = await prisma.signers.findFirst({
  //   where: {
  //     key: cast.signer
  //   }
  // });
  // const clientFid =
  //   signer?.metadata_type === 1
  //     ? ((signer?.metadata as JsonObject | undefined)?.requestFid as string) ||
  //       null
  //     : null;
  // const clientUser = clientFid
  //   ? await resolveUserFromFid(BigInt(clientFid))
  //   : null;

  let topic: TopicType | null = null;
  if (cast.root_parent_url) {
    topic = await resolveTopic(cast.root_parent_url);
  }

  const tweetWithUsers: TweetWithUsers = {
    ...tweet,
    users,
    topic: topic,
    client: null
  };

  res.json({
    result: tweetWithUsers
  });
}
