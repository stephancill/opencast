import { BaseResponse } from './responses';

export type AppAuthResponse = BaseResponse<AppAuthType>;

type AppAuthType = {
  requestFid: number;
  requestSigner: string;
  signature: string;
  deadline: number;
};
