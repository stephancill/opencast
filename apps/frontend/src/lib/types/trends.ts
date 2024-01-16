import { TopicType } from './topic';
import { BaseResponse } from './responses';

export type TrendsResponse = BaseResponse<
  {
    topic: TopicType | null;
    volume: number;
  }[]
>;
