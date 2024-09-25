import { BaseResponse } from './responses';

export type StoriesAPIResponse = {
  stories: {
    streak?: {
      streakLength: number;
      currentStreak: number;
    };
    posts: {
      viewed: boolean;
      storyId: string;
      createdAt: string;
      viewCount: number | null | undefined;
    }[];
    user: {
      pfp_url: string;
      display_name: string;
      username: string;
      fid: number;
    };
    startIndex: number;
    viewedAll: boolean;
  }[];
};

export type StoriesResponse = BaseResponse<StoriesAPIResponse>;
