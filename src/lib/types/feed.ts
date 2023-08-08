import { Tweet } from './tweet';
import { BaseResponse } from './responses';

export interface FeedResponse extends BaseResponse<Tweet[]> {}
