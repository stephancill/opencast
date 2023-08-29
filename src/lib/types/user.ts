import { UserDataType } from '@farcaster/hub-web';
import { BaseResponse } from './responses';
import type { Accent, Theme } from './theme';
import { TopicType } from './topic';

export type User = {
  id: string;
  bio: string | null;
  name: string;
  username: string;
  photoURL: string;
  verified: boolean;
};

export type UserFull = User & {
  theme: Theme | null;
  accent: Accent | null;
  website: string | null;
  location: string | null;
  following: string[];
  followers: string[];
  createdAt: Date;
  updatedAt: Date | null;
  totalTweets: number;
  totalPhotos: number;
  pinnedTweet: string | null;
  coverPhotoURL: string | null;
  interests: TopicType[];
  address: string | null;
};

export type EditableData = Extract<
  keyof UserFull,
  'bio' | 'name' | 'website' | 'photoURL' | 'location' | 'coverPhotoURL'
>;

export type EditableUserData = Pick<UserFull, EditableData>;

export type UserResponse = BaseResponse<UserFull>;

export type UsersMapType<T> = { [key: string]: T };

export const userConverter = {
  toUser(user: any): User {
    return {
      id: user.fid.toString(),
      bio: user[UserDataType.BIO] ?? null,
      name: user[UserDataType.DISPLAY],
      username: user[UserDataType.USERNAME],
      photoURL: user[UserDataType.PFP], //user['1'],
      verified: false
    } as User;
  },

  toUserFull(user: any): UserFull {
    return {
      id: user.fid.toString(),
      bio: user[UserDataType.BIO] ?? null,
      name: user[UserDataType.DISPLAY],
      theme: null,
      accent: null,
      website: null,
      location: null,
      username: user[UserDataType.USERNAME],
      photoURL: user[UserDataType.PFP], //user['1'],
      coverPhotoURL: null,
      verified: false,
      following: [],
      followers: [],
      createdAt: new Date(),
      updatedAt: null,
      totalTweets: 0,
      totalPhotos: 0,
      pinnedTweet: null,
      interests: [],
      address: null
    } as UserFull;
  }
};
