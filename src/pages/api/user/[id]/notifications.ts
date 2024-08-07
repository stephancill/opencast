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

      // Get last reaction and last cast from other clients
      const lastActivity = (await prisma.$queryRaw`
        SELECT timestamp FROM (
          SELECT 'cast' as type, id, fid, timestamp
          FROM casts
          WHERE 
            fid = ${fid} AND
            deleted_at IS NULL AND
            timestamp > ${afterTime}
          UNION ALL
          SELECT 'reaction' as type, id, fid, timestamp
          FROM reactions
          WHERE 
            fid = ${fid} AND
            deleted_at IS NULL AND
            timestamp > ${afterTime}
        ) AS combined
        LEFT JOIN signers ON combined.fid = signers.fid
        WHERE 
          (signers.requester_fid IS NULL OR signers.requester_fid != ${BigInt(
            process.env.APP_FID!
          )})
        ORDER BY timestamp DESC
        LIMIT 1
      `) as { timestamp: Date }[];

      // Consider that user would likely have cleared notifications badge on the other client
      // afterTime is the max of last activity or afterTime
      if (lastActivity.length > 0 && req.query.last_time) {
        afterTime = new Date(
          Math.max(
            afterTime?.getTime() || 0,
            lastActivity[0].timestamp.getTime()
          )
        );
      }

      const userPostsReactions = (await prisma.$queryRaw`
        SELECT 
          casts.*, 
          reactions.type as reaction_type, 
          reactions.fid as message_fid, 
          reactions.hash as message_hash, 
          reactions.timestamp as message_timestamp,
          3 as message_type
        FROM casts 
        JOIN reactions ON casts.hash = reactions.target_cast_hash 
        WHERE
            casts.fid = ${fid} AND
            reactions.deleted_at IS NULL AND
            reactions.timestamp > ${afterTime}
        ORDER BY reactions.timestamp DESC;
      `) as ReactionQueryResult[];

      const userNewFollowers = (await prisma.$queryRaw`
        SELECT 
          links.fid as message_fid, 
          links.hash as message_hash, 
          5 as message_type,
          links.timestamp as message_timestamp
        FROM links
        WHERE
            links.target_fid = ${fid} AND
            links.type = 'follow' AND
            links.deleted_at IS NULL AND
            links.timestamp > ${afterTime};
      `) as FollowerQueryResult[];

      const userPostsReplies = (await prisma.$queryRaw`
        SELECT replies.*, 
        replies.fid as message_fid, 
        replies.hash as message_hash, 
        replies.timestamp as message_timestamp,
        1 as message_type,
        casts.fid as parent_fid 
        FROM casts as replies
        JOIN casts ON casts.hash = replies.parent_hash
        WHERE 
            casts.fid = ${fid} AND
            replies.deleted_at IS NULL AND
            casts.deleted_at IS NULL AND
            replies.timestamp > ${afterTime};
      `) as RepliesQueryResult[];

      const userMentions = (await prisma.$queryRaw`
        SELECT casts.*, 
        casts.fid as message_fid, 
        casts.hash as message_hash, 
        casts.timestamp as message_timestamp,
        1 as message_type
        FROM casts
        CROSS JOIN LATERAL json_array_elements_text(casts.mentions) as mention
        WHERE
            casts.deleted_at IS NULL AND
            casts.timestamp > ${afterTime} AND
            mention::INTEGER = ${fid};`) as MentionsQueryResult[];

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
        if ('parent_fid' in item) {
          if (item.parent_fid)
            fids.add((item as { parent_fid: bigint }).parent_fid);
        }
        if ('mentions' in item) {
          ((item as any as RepliesQueryResult).mentions as number[]).forEach(
            (mention) => fids.add(BigInt(mention))
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
