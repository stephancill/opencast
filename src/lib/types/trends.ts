import { ChannelType } from '../channel/resolve-channel';
import { BaseResponse } from './responses';

export type TrendsResponse = BaseResponse<
  {
    channel: ChannelType | null;
    volume: number;
    url: string;
  }[]
>;
