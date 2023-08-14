import { TopicType } from '../topics/resolve-topic';
import { BaseResponse } from './responses';

export type TrendsResponse = BaseResponse<
  {
    topic: TopicType | null;
    volume: number;
  }[]
>;
