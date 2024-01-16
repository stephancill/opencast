import { BaseResponse } from './responses';

export type TopicResponse = BaseResponse<TopicType>;

export type TopicType = {
  name: string;
  description: string;
  image?: string;
  url: string;
};
