import { BaseResponse } from './responses';
import { User } from './user';

export type OnlineUsersResponse = BaseResponse<
  {
    user: User;
    lastOnline: Date;
  }[]
>;
