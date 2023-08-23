import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';
import { NotificationsResponse } from '../../../../lib/types/notifications';

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse<NotificationsResponse>
) {
  const { method } = req;
  switch (method) {
    case 'GET':
      const fid = parseInt(req.query.id as string);
      const lastTime = new Date(req.query.last_time as string);

      if (!fid) {
        res.status(400).json({ message: 'Missing id' });
        return;
      }

      if (!lastTime) {
        res.status(400).json({ message: 'Missing time' });
        return;
      }

      const userPostsReactions = (await prisma.$queryRaw`
        SELECT casts.*, reactions.fid as reaction_fid, reactions.reaction_type as reaction_type, messages.hash as reaction_hash, messages.message_type as message_type
        FROM casts 
        JOIN reactions ON casts.hash = reactions.target_hash 
        JOIN messages ON reactions.hash = messages.hash
        WHERE
            casts.fid = ${fid} AND
            messages.message_type = 3 AND
            reactions.deleted_at IS NULL AND
            messages.timestamp > ${lastTime};
      `) as any;

      // Querying new followers
      const userNewFollowers = (await prisma.$queryRaw`
        SELECT links.fid as fid, messages.hash as link_hash, messages.message_type as message_type
        FROM links
        JOIN messages ON links.hash = messages.hash
        WHERE
            links.target_fid = ${fid} AND
            messages.message_type = 5 AND
            links.type = 'follow' AND
            links.deleted_at IS NULL AND
            messages.timestamp > ${lastTime};
      `) as any;

      const userPostsReplies = (await prisma.$queryRaw`
        SELECT replies.*, casts.hash
        FROM casts as replies
        JOIN casts ON casts.hash = replies.parent_hash
        WHERE 
            casts.fid = ${fid} AND
            replies.deleted_at IS NULL AND
            casts.deleted_at IS NULL AND
            replies.timestamp > ${lastTime};
      `) as any;

      const userMentions = (await prisma.$queryRaw`
        SELECT casts.*, messages.hash as message_hash, messages.message_type as message_type
        FROM casts
        JOIN messages ON casts.hash = messages.hash
        WHERE
            casts.deleted_at IS NULL AND
            casts.timestamp > ${lastTime} AND
            ${fid} = ANY(casts.mentions);`) as any;

      const badgeCount =
        userNewFollowers.length +
        userPostsReactions.length +
        userPostsReplies.length +
        userMentions.length;

      // console.log(`User ${fid} has ${badgeCount} new notifications`);

      res.json({
        result: {
          // followers: userNewFollowers.length,
          // reactions: userPostsReactions.length,
          // replies: userPostsReplies.length,
          // mentions: userMentions.length,
          badgeCount,
          lastChecked: new Date().toISOString()
        }
      });

      break;
    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
