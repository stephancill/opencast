import { casts } from '@prisma/client';
import type { ImagesPreview } from './file';
import { BaseResponse } from './responses';
import type { User } from './user';

export type Tweet = {
  id: string;
  text: string | null;
  images: ImagesPreview | null;
  parent: { id: string; username: string } | null;
  userLikes: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date | null;
  userReplies: number;
  userRetweets: string[];
};

export type TweetWithUser = Tweet & { user: User };

export type TweetResponse = BaseResponse<TweetWithUser>;

export const tweetConverter = {
  toTweet(cast: casts): Tweet {
    // Check if cast.hash is a buffer
    const isBuffer = Buffer.isBuffer(cast.hash);

    return {
      id: isBuffer
        ? cast.hash
        : Buffer.from((cast.hash as any).data).toString('hex'),
      text: cast.text,
      images: null,
      parent: null,
      userLikes: [],
      createdBy: cast.fid.toString(),
      createdAt: cast.created_at,
      updatedAt: null,
      userReplies: 0,
      userRetweets: []
    } as Tweet;
  }
};
