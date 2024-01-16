import { BaseResponse } from './responses';

export type AppAuthResponse = BaseResponse<AppAuthType>;

export type AppAuthType = {
  requestFid: number;
  requestSigner: string;
  signature: string;
  deadline: number;
};
