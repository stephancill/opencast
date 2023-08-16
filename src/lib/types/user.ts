import { UserDataType } from '@farcaster/hub-web';
import { Timestamp } from 'firebase/firestore';
import { BaseResponse } from './responses';
import type { Accent, Theme } from './theme';
import { TopicType } from './topic';

export type User = {
  id: string;
  bio: string | null;
  name: string;
  theme: Theme | null;
  accent: Accent | null;
  website: string | null;
  location: string | null;
  username: string;
  photoURL: string;
  verified: boolean;
  following: string[];
  followers: string[];
  createdAt: Date;
  updatedAt: Date | null;
  totalTweets: number;
  totalPhotos: number;
  pinnedTweet: string | null;
  coverPhotoURL: string | null;
  interests: TopicType[];
};

export type EditableData = Extract<
  keyof User,
  'bio' | 'name' | 'website' | 'photoURL' | 'location' | 'coverPhotoURL'
>;

export type EditableUserData = Pick<User, EditableData>;

export type UserResponse = BaseResponse<User>;

export type UsersMapType = { [key: string]: User };

export const userConverter = {
  toUser(user: any): User {
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
      interests: []
    } as User;
  }
};
