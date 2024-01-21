import type { Timestamp } from 'firebase/firestore';

export type Bookmark = {
  id: string;
  createdAt: Timestamp;
};
