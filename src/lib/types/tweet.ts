import { Embed } from '@farcaster/hub-web';
import { casts } from '@prisma/client';
import { replaceOccurrencesMultiple } from '../utils';
import { isValidImageExtension } from '../validation';
import type { ImagesPreview } from './file';
import { BaseResponse } from './responses';
import type { User } from './user';

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
};

export type TweetWithUser = Tweet & { user: User };

export type TweetResponse = BaseResponse<TweetWithUser>;
export interface TweetRepliesResponse
  extends BaseResponse<{
    tweets: Tweet[];
    nextPageCursor: string | null;
    // fid -> User
    users: { [key: string]: User };
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

    // Remove images links that will be embedded from text
    const formattedText = replaceOccurrencesMultiple(
      cast.text,
      images.map((img) => img.src ?? '') ?? [],
      ''
    );

    return {
      id: isBuffer
        ? cast.hash.toString('hex')
        : Buffer.from((cast.hash as any).data).toString('hex'),
      text: formattedText,
      images: images.length > 0 ? images : null,
      parent,
      userLikes: [],
      createdBy: cast.fid.toString(),
      createdAt: cast.timestamp,
      updatedAt: null,
      userReplies: 0,
      userRetweets: []
    } as Tweet;
  }
};
