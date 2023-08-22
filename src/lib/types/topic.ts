import { BaseResponse } from './responses';

export type TopicResponse = BaseResponse<TopicType>;

export type TopicType = {
  name: string;
  description: string;
  image?: string;
  url: string;
};

export type InterestType = {
  topic: TopicType;
  volume: number;
};
