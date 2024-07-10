import { BaseResponse } from './responses';
import { User } from './user';

export type AppProfile = { pfp?: string; display?: string; username?: string };

export type OnlineUsersResponse = BaseResponse<{
  users: {
    user: User;
    lastOnline: Date;
    appFid: string;
  }[];
  appProfilesMap: Record<string, AppProfile>;
}>;
