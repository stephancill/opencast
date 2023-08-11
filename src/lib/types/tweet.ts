import { Embed } from '@farcaster/hub-web';
import { casts } from '@prisma/client';
import { isValidImageExtension } from '../validation';
import type { ImagesPreview } from './file';
import { BaseResponse } from './responses';
import type { UsersMapType } from './user';

export type Mention = {
  userId: string;
  position: number;
  username?: string;
};

export type Tweet = {
  id: string;
  text: string | null;
  images: ImagesPreview | null;
  parent: { id: string; username?: string; userId?: string } | null;
  userLikes: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date | null;
  userReplies: number;
  userRetweets: string[];
  mentions: Mention[];
};

export type TweetWithUsers = Tweet & { users: UsersMapType };

export type TweetResponse = BaseResponse<TweetWithUsers>;
export interface TweetRepliesResponse
  extends BaseResponse<{
    tweets: Tweet[];
    nextPageCursor: string | null;
    // fid -> User
    users: UsersMapType;
  }> {}

export const tweetConverter = {
  toTweet(cast: casts): Tweet {
    // Check if cast.hash is a buffer
    const isBuffer = Buffer.isBuffer(cast.hash);

    let parent: { id: string; userId?: string } | null = null;
    if (cast.parent_hash) {
      parent = {
        id: cast.parent_hash.toString('hex'),
        userId: cast.parent_fid?.toString()
      };
    }

    const embeds = cast.embeds as Embed[];

    const images =
      embeds.length > 0
        ? embeds
            .filter((embed) => embed.url && isValidImageExtension(embed.url))
            .map((embed) => ({
              src: embed.url,
              alt: '',
              id: embed.url
            }))
        : [];

    const mentions = cast.mentions.map(
      (userId, index): Mention => ({
        userId: userId.toString(),
        position: cast.mentions_positions[index]
      })
    );

    return {
      id: isBuffer
        ? cast.hash.toString('hex')
        : Buffer.from((cast.hash as any).data).toString('hex'),
      text: cast.text,
      images: images.length > 0 ? images : null,
      parent,
      userLikes: [],
      createdBy: cast.fid.toString(),
      createdAt: cast.timestamp,
      updatedAt: null,
      userReplies: 0,
      userRetweets: [],
      mentions
    } as Tweet;
  }
};
