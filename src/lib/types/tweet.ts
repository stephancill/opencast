import { Embed } from '@farcaster/hub-web';
import { casts } from '@prisma/client';
import { TopicsMapType } from '../topics/resolve-topic';
import { TopicType } from './topic';
import { isValidImageExtension } from '../validation';
import type { ImagesPreview } from './file';
import { BaseResponse } from './responses';
import type { User, UsersMapType } from './user';

export type Mention = {
  userId: string;
  position: number;
  username?: string;
  user?: User;
};

export type ExternalEmbed = {
  title?: string;
  text?: string;
  icon?: string;
  image?: string;
  provider?: string;
  url: string;
};

export type Tweet = {
  id: string;
  text: string | null;
  images: ImagesPreview | null;
  embeds: ExternalEmbed[];
  parent: { id: string; username?: string; userId?: string } | null;
  userLikes: string[];
  createdBy: string;
  user: User | null;
  createdAt: Date;
  updatedAt: Date | null;
  deletedAt: Date | null;
  userReplies: number;
  userRetweets: string[];
  mentions: Mention[];
  client: string | null;
  topic: TopicType | null;
  topicUrl: string | null;
  retweet: { username?: string; userId?: string } | null;
};

export type TweetWithUsers = Tweet & { users: UsersMapType<User> };

export type TweetResponse = BaseResponse<TweetWithUsers>;
export interface TweetRepliesResponse
  extends BaseResponse<{
    tweets: Tweet[];
    nextPageCursor: string | null;
    // fid -> User
    users: UsersMapType<User>;
  }> {}

export const populateTweetUsers = (
  tweet: Tweet,
  users: UsersMapType<User>
): Tweet => {
  // Look up parent tweet username in users object
  const resolvedParent = tweet.parent;
  if (resolvedParent && !tweet.parent?.username && tweet.parent?.userId) {
    tweet.parent.username = users[tweet.parent.userId]?.username;
  }

  // Look up mentions in users object
  const resolvedMentions = tweet.mentions.map((mention) => ({
    ...mention,
    username: users[mention.userId]?.username,
    user: users[mention.userId]
  }));

  // Look up recast username in users object
  const resolvedRetweet = tweet.retweet;
  if (
    resolvedRetweet &&
    !tweet.retweet?.username &&
    tweet.retweet?.userId &&
    users[tweet.retweet.userId]
  ) {
    tweet.retweet.username = users[tweet.retweet.userId]?.username;
  }

  const resolvedUser = users[tweet.createdBy];

  return {
    ...tweet,
    mentions: resolvedMentions,
    parent: resolvedParent,
    retweet: resolvedRetweet,
    user: resolvedUser
  };
};

export const populateTweetTopic = (
  tweet: Tweet,
  topics: TopicsMapType
): Tweet => {
  if (tweet.topicUrl) {
    const topic = topics[tweet.topicUrl];
    if (topic) {
      return {
        ...tweet,
        topic
      };
    }
  }
  return tweet;
};

export const tweetConverter = {
  toTweet(cast: casts & { client?: string }): Tweet {
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

    const externalEmbeds: ExternalEmbed[] =
      embeds.length > 0
        ? embeds
            .filter((embed) => embed.url && !isValidImageExtension(embed.url))
            .map((embed) => ({
              url: embed.url!
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
      embeds: externalEmbeds,
      parent,
      topic: null,
      topicUrl: cast.parent_url,
      userLikes: [],
      createdBy: cast.fid.toString(),
      user: null,
      createdAt: cast.timestamp,
      updatedAt: null,
      deletedAt: cast.deleted_at,
      userReplies: 0,
      userRetweets: [],
      mentions,
      client: cast.client || null,
      retweet: null
    } as Tweet;
  }
};

export function mergeMetadataCacheResponse(
  tweets: Tweet[],
  metadataJson: any
): Tweet[] {
  const merged = tweets.map((tweet) => {
    return {
      ...tweet,
      embeds: metadataJson[`0x${tweet.id}`]
    };
  });

  return merged;
}
