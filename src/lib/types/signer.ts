import { Message } from '@farcaster/hub-web';
import { BaseResponse } from './responses';

export type SignerDetail = {
  name: string | null;
  pubKey: string;
  messageCount: number;
  createdAtTimestamp: string;
  lastMessageTimestamp: string;
};

export type SignersResponse = BaseResponse<SignerDetail[]>;
export type SignerResponse = BaseResponse<SignerDetail>;

export type MessagesArchive = {
  messages: Message[];
  signer: SignerDetail;
};

export type MessagesArchiveResponse = BaseResponse<MessagesArchive>;
