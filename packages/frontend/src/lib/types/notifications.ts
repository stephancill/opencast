import { Cast } from '@selekt/db';
import { BaseResponse } from './responses';
import { Tweet } from './tweet';
import { User, UsersMapType } from './user';

type MessageMetadata = {
  message_fid: bigint;
  message_hash: Buffer;
  messageType: number;
  message_timestamp: Date;
};

export type ReactionQueryResult = Cast &
  MessageMetadata & {
    reactionType: number;
  };

export type FollowerQueryResult = MessageMetadata;

export type RepliesQueryResult = Cast & MessageMetadata & { parentFid: bigint };

export type MentionsQueryResult = Cast &
  MessageMetadata & {
    parentFid: bigint | null;
  };

export type BasicNotification = {
  userId: string;
  timestamp: Date;
  messageType: number;
};

export type BasicReaction = BasicNotification & {
  targetCastId: string;
  reactionType: number;
};
export type BasicFollow = BasicNotification;
export type BasicReply = BasicNotification & {
  castId: string;
  parentUserId: string;
};
export type BasicMention = BasicNotification & { castId: string };

type NotificationsSummary = {
  badgeCount: number;
  lastChecked: string;
};

export type NotificationsResponseSummary = BaseResponse<NotificationsSummary>;

export type AccumulatedReaction = BasicNotification & {
  castId: string;
  reactions: BasicReaction[];
  reactionType: number;
  userId: string;
};

export type AccumulatedFollow = BasicNotification & {
  follows: BasicFollow[];
};

export type NotificationsResponseFull = BaseResponse<
  NotificationsSummary & {
    notifications: BasicNotification[];
    tweetsMap: { [key: string]: Tweet };
    usersMap: UsersMapType<User>;
    cursor: number | null;
  }
>;
