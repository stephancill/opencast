import { Tweet } from './tweet';
import { BaseResponse } from './responses';
import { User } from './user';

export interface FeedResponse
  extends BaseResponse<{
    tweets: Tweet[];
    nextPageCursor: string | null;
    // fid -> User
    users: { [key: string]: User };
  }> {}
