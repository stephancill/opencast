import { UserDataType } from '@farcaster/hub-web';
import { prisma } from '../prisma';
import { User, userConverter, UsersMapType } from '../types/user';

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

  const user = userConverter.toUser({ ...userDataRaw, fid });

  return {
    ...user,
    followers: followers.map((f) => f.fid!.toString()),
    following: following.map((f) => f.target_fid!.toString()),
    totalTweets: castCount._count
  };
}

export async function resolveUserAmbiguous(
  idOrUsername: string
): Promise<User | null> {
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

  return await resolveUserFromFid(BigInt(fid));
}

// TODO: Combine into one query
// TODO: Cache results
// TODO: Only pass minimal user data and fetch on-demand
export async function resolveUsersMap(fids: bigint[]): Promise<UsersMapType> {
  const userOrNulls = await Promise.all(
    fids.map((fid) => resolveUserFromFid(fid))
  );
  const users = userOrNulls.filter(
    (userOrNull) => userOrNull !== null
  ) as User[];
  const usersMap = users.reduce((acc: UsersMapType, cur) => {
    if (cur) {
      acc[cur.id] = cur;
    }
    return acc;
  }, {});
  return usersMap;
}
