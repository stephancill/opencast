import { Prisma } from '@selekt/db';
import { prisma } from './prisma';
import { BaseResponse } from './types/responses';
import { User } from './types/user';
import { resolveUsers } from './user/resolve-user';

export interface PaginatedUsersResponse
  extends BaseResponse<{
    users: User[];
    nextPageCursor: string | null;
  }> {}

export async function getUsersPaginated(
  findManyArgs: Prisma.reactionsFindManyArgs,
  full: boolean = false
) {
  const reactions = await prisma.reactions.findMany(findManyArgs);

  const fids = reactions.map((reaction) => reaction.fid);

  const users = await resolveUsers([...fids], full);

  const nextPageCursor =
    reactions.length > 0
      ? reactions[reactions.length - 1].timestamp.toISOString()
      : null;

  return {
    users,
    nextPageCursor
  };
}
