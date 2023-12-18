import { BaseResponse } from './responses';

export type Signer = {
  pubKey: string;
  messageCount: number;
  createdAtTimestamp: string;
  lastMessageTimestamp: string;
  name: string | null;
};

export type SignersResponse = BaseResponse<Signer[]>;
