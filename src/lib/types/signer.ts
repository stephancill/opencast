import { Message } from '@farcaster/hub-web';
import { BaseResponse } from './responses';

export type SignerDetail = {
  name: string | null;
  pubKey: `0x${string}`;
  messageCount: number;
  createdAtTimestamp: string;
  lastMessageTimestamp: string;
  noneCount: number;
  castAddCount: number;
  castRemoveCount: number;
  reactionAddCount: number;
  reactionRemoveCount: number;
  linkAddCount: number;
  linkRemoveCount: number;
  verificationAddEthAddressCount: number;
  verificationRemoveCount: number;
};

export type SignersResponse = BaseResponse<SignerDetail[]>;
export type SignerResponse = BaseResponse<SignerDetail>;

export type MessagesArchive = {
  messages: Message[];
  signer: SignerDetail;
};

export type MessagesArchiveResponse = BaseResponse<MessagesArchive>;
