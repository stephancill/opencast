import { UserDataType } from '@farcaster/hub-web';
import { prisma } from '../prisma';
import { User, userConverter, UserFull, UsersMapType } from '../types/user';
import { TopicType } from '../types/topic';
import { resolveTopic } from '../topics/resolve-topic';

export async function resolveUserFromFid(fid: bigint): Promise<User | null> {
  const userData = await prisma.user_data.findMany({
    where: {
      fid: fid
    }
  });

  if (userData.length === 0) {
    return null;
  }

  const userDataRaw = userData.reduce((acc: any, cur) => {
    acc = {
      ...acc,
      [cur.type]: cur.value
    };
    return acc;
  }, {});

  const user = userConverter.toUser({ ...userDataRaw, fid });

  return user;
}

export async function resolveUserFullFromFid(
  fid: bigint
): Promise<UserFull | null> {
  const userData = await prisma.user_data.findMany({
    where: {
      fid: fid
    }
  });

  if (userData.length === 0) {
    return null;
  }

  const userDataRaw = userData.reduce((acc: any, cur) => {
    acc = {
      ...acc,
      [cur.type]: cur.value
    };
    return acc;
  }, {});

  const followers = await prisma.links.findMany({
    where: {
      target_fid: fid,
      type: 'follow'
    },
    distinct: ['target_fid', 'fid']
  });

  const following = await prisma.links.findMany({
    where: {
      fid: fid,
      type: 'follow',
      deleted_at: null
    },
    distinct: ['target_fid', 'fid']
  });

  const castCount = await prisma.casts.aggregate({
    where: {
      fid: fid,
      deleted_at: null
    },
    _count: true
  });

  const interests = await userInterests(fid);

  const user = userConverter.toUserFull({ ...userDataRaw, fid });

  return {
    ...user,
    followers: followers.map((f) => f.fid!.toString()),
    following: following.map((f) => f.target_fid!.toString()),
    totalTweets: castCount._count,
    interests
  };
}

export async function resolveUserAmbiguous(
  idOrUsername: string,
  full: boolean = false
): Promise<User | UserFull | null> {
  let fid = Number(idOrUsername);
  if (isNaN(fid)) {
    const username = (idOrUsername as string).toLowerCase();
    const usernameData = await prisma.user_data.findFirst({
      where: {
        type: UserDataType.USERNAME,
        value: username
      }
    });
    if (usernameData) {
      fid = Number(usernameData.fid);
    } else {
      return null;
    }
  }

  if (full) {
    return await resolveUserFullFromFid(BigInt(fid));
  } else {
    return await resolveUserFromFid(BigInt(fid));
  }
}

// TODO: Combine into one query
export async function resolveUsers(
  fids: bigint[],
  full: boolean = false
): Promise<(User | UserFull)[]> {
  const users = await Promise.all(
    full
      ? fids.map((fid) => resolveUserFromFid(fid))
      : fids.map((fid) => resolveUserFullFromFid(fid))
  );
  return users.filter((user) => user !== null) as (User | UserFull)[];
}

// TODO: Combine into one query
// TODO: Cache results
// TODO: Only pass minimal user data and fetch on-demand
export async function resolveUsersMap(
  fids: bigint[],
  full: boolean = false
): Promise<UsersMapType<User | UserFull>> {
  const userOrNulls = await Promise.all(
    fids.map((fid) => resolveUserFromFid(fid))
  );
  const users = userOrNulls.filter(
    (userOrNull) => userOrNull !== null
  ) as User[];
  const usersMap = users.reduce((acc: UsersMapType<User | UserFull>, cur) => {
    if (cur) {
      acc[cur.id] = cur;
    }
    return acc;
  }, {});
  return usersMap;
}

export async function userInterests(fid: bigint): Promise<TopicType[]> {
  const reactionGroups = (await prisma.$queryRaw`
        SELECT 
            c.parent_url, 
            COUNT(*) as reaction_count 
        FROM 
            reactions r
        INNER JOIN 
            casts c ON r.target_hash = c.hash 
        WHERE 
            r.fid = ${fid}  
            AND c.deleted_at IS NULL 
            AND c.parent_url IS NOT NULL 
        GROUP BY c.parent_url
        ORDER BY reaction_count DESC
        LIMIT 5;
      `) as { parent_url: string; reaction_count: number }[];

  const topics = (
    await Promise.all(
      reactionGroups.map(async (group) => {
        const url = group.parent_url!;
        const topic = await resolveTopic(url);
        if (!topic) {
          console.error(`Unresolved topic: ${group.parent_url}`);
        }
        return topic;
      })
    )
  ).filter((topic) => topic !== null) as TopicType[];

  return topics;
}
