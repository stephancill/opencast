import { Timestamp } from 'firebase/firestore';
import { BaseResponse } from './responses';
import type { Theme, Accent } from './theme';

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
  createdAt: Timestamp;
  updatedAt: Timestamp | null;
  totalTweets: number;
  totalPhotos: number;
  pinnedTweet: string | null;
  coverPhotoURL: string | null;
};

export type EditableData = Extract<
  keyof User,
  'bio' | 'name' | 'website' | 'photoURL' | 'location' | 'coverPhotoURL'
>;

export type EditableUserData = Pick<User, EditableData>;

export type USerResponse = BaseResponse<User>;

// export const userConverter: FirestoreDataConverter<User> = {
//   toFirestore(user) {
//     return { ...user };
//   },
//   fromFirestore(snapshot, options) {
//     const data = snapshot.data(options);
//     return { ...data } as User;
//   }
// };

export const userConverter = {
  toUser(user: any): User {
    return {
      id: user.fid.toString(),
      bio: user['3'] ?? null,
      name: user['2'],
      theme: null,
      accent: null,
      website: null,
      location: null,
      username: user['6'],
      photoURL: user['1'], //user['1'],
      coverPhotoURL: null,
      verified: false,
      following: [],
      followers: [],
      createdAt: Timestamp.now(),
      updatedAt: null,
      totalTweets: 0,
      totalPhotos: 0,
      pinnedTweet: null
    } as User;
  }
};
