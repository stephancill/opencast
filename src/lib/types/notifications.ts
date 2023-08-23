import { BaseResponse } from './responses';

export type NotificationsResponse = BaseResponse<{
  badgeCount: number;
  lastChecked: string;
}>;
