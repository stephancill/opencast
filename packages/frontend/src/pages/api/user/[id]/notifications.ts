import { NextApiRequest, NextApiResponse } from 'next';
import { castsToTweets } from '../../../../lib/paginated-tweets';
import { prisma } from '../../../../lib/prisma';
import {
  AccumulatedFollow,
  AccumulatedReaction,
  BasicFollow,
  BasicMention,
  BasicNotification,
  BasicReaction,
  BasicReply,
  FollowerQueryResult,
  MentionsQueryResult,
  NotificationsResponseFull,
  NotificationsResponseSummary,
  ReactionQueryResult,
  RepliesQueryResult
} from '../../../../lib/types/notifications';
import { Tweet, tweetConverter } from '../../../../lib/types/tweet';
import { User, UsersMapType } from '../../../../lib/types/user';
import { resolveUsersMap } from '../../../../lib/user/resolve-user';

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse<NotificationsResponseFull | NotificationsResponseSummary>
) {
  const { method } = req;
  switch (method) {
    case 'GET':
      const fid = parseInt(req.query.id as string);
      const cursor =
        req.query.cursor && req.query.cursor !== 'undefined'
          ? Number(req.query.cursor)
          : 0;
      const limit =
        req.query.limit && req.query.limit !== 'undefined'
          ? Number(req.query.limit)
          : 10;
      let afterTime = req.query.last_time
        ? new Date(req.query.last_time as string)
        : null;
      const beforeTime = req.query.before_time
        ? new Date(req.query.before_time as string)
        : null;
      const full = !!req.query.full && req.query.full !== 'false';

      if (!fid) {
        res.status(400).json({ message: 'Missing id' });
        return;
      }

      if (!(afterTime || beforeTime)) {
        res.status(400).json({ message: 'Missing time' });
        return;
      }

      if (beforeTime) {
        // Last time = before time - 24 hours
        afterTime = new Date(beforeTime.getTime() - 24 * 60 * 60 * 1000);
      }

      const userPostsReactions = (await prisma.$queryRaw`
        SELECT 
          Cast.*, 
          Reaction.reaction_type as reaction_type, 
          Message.fid as message_fid, 
          Message.hash as message_hash, 
          Message.timestamp as message_timestamp,
          Message.message_type as message_type
        FROM Cast 
        JOIN Reaction ON Cast.hash = Reaction.target_hash 
        JOIN Message ON Reaction.hash = Message.hash
        WHERE
            Cast.fid = ${fid} AND
            Message.message_type = 3 AND
            Reaction.deleted_at IS NULL AND
            Message.timestamp > ${afterTime}
        ORDER BY Reaction.timestamp DESC;
      `) as ReactionQueryResult[];

      const userNewFollowers = (await prisma.$queryRaw`
        SELECT 
          Message.fid as message_fid, 
          Message.hash as message_hash, 
          Message.message_type as message_type,
          Message.timestamp as message_timestamp
        FROM Link
        JOIN Message ON Link.hash = Message.hash
        WHERE
            Link.target_fid = ${fid} AND
            Message.message_type = 5 AND
            Link.type = 'follow' AND
            Link.deleted_at IS NULL AND
            Message.timestamp > ${afterTime};
      `) as FollowerQueryResult[];

      const userPostsReplies = (await prisma.$queryRaw`
        SELECT replies.*, 
        replies.fid as message_fid, 
        replies.hash as message_hash, 
        replies.timestamp as message_timestamp,
        Message.message_type as message_type,
        Cast.fid as parent_fid 
        FROM Cast as replies
        JOIN Cast ON Cast.hash = replies.parent_hash
        JOIN Message ON replies.hash = Message.hash
        WHERE 
            Cast.fid = ${fid} AND
            replies.deleted_at IS NULL AND
            Cast.deleted_at IS NULL AND
            replies.timestamp > ${afterTime};
      `) as RepliesQueryResult[];

      const userMentions = (await prisma.$queryRaw`
        SELECT Cast.*, 
        Cast.fid as message_fid, 
        Cast.hash as message_hash, 
        Cast.timestamp as message_timestamp,
        Message.message_type as message_type
        FROM Cast
        JOIN Message ON Cast.hash = Message.hash
        WHERE
            Cast.deleted_at IS NULL AND
            Cast.timestamp > ${afterTime} AND
            ${fid} = ANY(casts.mentions);`) as MentionsQueryResult[];

      const badgeCount =
        userNewFollowers.length +
        userPostsReactions.length +
        userPostsReplies.length +
        userMentions.length;

      if (!full) {
        res.json({
          result: {
            badgeCount,
            lastChecked: new Date().toISOString()
          }
        });
        return;
      }

      const fids: Set<bigint> = new Set<bigint>();
      [
        ...userPostsReactions,
        ...userNewFollowers,
        ...userPostsReplies,
        ...userMentions
      ].forEach((item) => {
        fids.add(item.message_fid);
        if ((item as any).parent_fid) fids.add((item as any).parent_fid);
        if ((item as any).mentions) {
          (item as any as RepliesQueryResult).mentions.forEach((mention) =>
            fids.add(mention)
          );
        }
      });
      const usersMap: UsersMapType<User> = await resolveUsersMap([...fids]);

      const { tweets: tweetsWithStats } = await castsToTweets([
        ...userPostsReplies,
        ...userMentions
      ]);
      const tweetsNoStats = userPostsReactions.map((cast) =>
        tweetConverter.toTweet(cast)
      );
      const tweetsMap = [...tweetsNoStats, ...tweetsWithStats].reduce(
        (acc: { [key: string]: Tweet }, cur) => {
          acc[cur.id] = cur;
          return acc;
        },
        {}
      );

      const basicReactions: BasicReaction[] = userPostsReactions.map(
        (reaction) => ({
          userId: reaction.message_fid.toString(),
          timestamp: reaction.message_timestamp,
          targetCastId: reaction.hash.toString('hex'),
          messageType: reaction.message_type,
          reactionType: reaction.reaction_type
        })
      );

      const basicFollows: BasicFollow[] = userNewFollowers.map((follower) => ({
        userId: follower.message_fid.toString(),
        timestamp: follower.message_timestamp,
        messageType: follower.message_type
      }));

      const basicReplies: BasicReply[] = userPostsReplies.map((reply) => ({
        userId: reply.message_fid.toString(),
        timestamp: reply.message_timestamp,
        castId: reply.hash.toString('hex'),
        messageType: reply.message_type,
        parentUserId: reply.parent_fid.toString()
      }));

      const basicMentions: BasicMention[] = userMentions.map((mention) => ({
        userId: mention.message_fid.toString(),
        timestamp: mention.message_timestamp,
        castId: mention.hash.toString('hex'),
        messageType: mention.message_type
      }));

      /* Combine into notifications */

      // Group reactions by cast
      const reactionsByCast = basicReactions.reduce(
        (
          acc: {
            [key: string]: AccumulatedReaction;
          },
          item
        ) => {
          const key = `${item.targetCastId}-${item.reactionType}`;
          if (!acc[key])
            acc[key] = {
              castId: item.targetCastId,
              reactions: [],
              ...item
            };
          acc[key].reactions.push(item);
          if (item.timestamp > acc[key].timestamp) {
            acc[key].timestamp = item.timestamp;
            acc[key].userId = item.userId;
          }
          return acc;
        },
        {}
      );

      const sortedFollows = basicFollows.sort((a, b) => {
        return (
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
      });
      const accumulatedFollow: AccumulatedFollow = {
        ...(sortedFollows[0] || {}),
        follows: sortedFollows
      };

      // Combine all notifications
      const allNotifications: BasicNotification[] = [
        ...Object.values(reactionsByCast),
        ...(sortedFollows.length > 0 ? [accumulatedFollow] : []),
        ...basicReplies,
        ...basicMentions
      ];

      // Sort by time
      allNotifications.sort((a, b) => {
        return (
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
      });

      res.json({
        result: {
          notifications: allNotifications.slice(cursor, cursor + limit),
          tweetsMap,
          usersMap,
          badgeCount,
          lastChecked: new Date().toISOString(),
          cursor:
            cursor + limit < allNotifications.length ? cursor + limit : null
        }
      });

      break;
    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
