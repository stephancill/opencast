/* eslint-disable react-hooks/exhaustive-deps */

import { useInfiniteQuery } from 'react-query';
import { motion } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import { casts } from '@prisma/client';
import { Tweet } from '../types/tweet';
import { Timestamp } from 'firebase/firestore';
import { User } from '../types/user';
import { Loading } from '../../components/ui/loading';

export function useInfiniteScroll(
  fid: string,
  options?: { initialSize?: number; stepSize?: number; marginBottom?: number }
) {
  const { initialSize, stepSize, marginBottom } = options ?? {
    initialSize: 10,
    stepSize: 10,
    marginBottom: 100
  };

  const [reachedLimit, setReachedLimit] = useState(false);
  const [loadMoreInView, setLoadMoreInView] = useState(false);

  const fetchCasts = async ({ pageParam = null }) => {
    const response = await fetch(
      `/api/feed?fid=${fid}&limit=${stepSize}${
        pageParam ? `&cursor=${pageParam}` : ''
      }`
    );
    if (!response.ok) {
      throw new Error('Could not fetch the casts');
    }

    const responseJson = (await response.json()) as {
      casts: casts[];
      nextPageCursor: string;
      users: any;
    };

    // Transform to tweet object
    const tweets = responseJson.casts.map((cast) => {
      return {
        id: Buffer.from((cast.hash as any).data).toString('hex'),
        text: cast.text,
        images: null,
        parent: null,
        userLikes: [],
        createdBy: cast.fid.toString(),
        createdAt: new Date(cast.created_at),
        updatedAt: null,
        userReplies: 0,
        userRetweets: []
      } as Tweet;
    });

    // Transform users
    const users = Object.keys(responseJson.users).map((fid) => {
      const user = responseJson.users[fid];
      return {
        id: fid,
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
    });

    const _users = users.reduce((acc, user) => {
      acc[user.id] = user;
      return acc;
    }, {} as { [key: string]: User });

    return {
      tweets,
      nextPageCursor: responseJson.nextPageCursor,
      users: _users
    };
  };

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isLoading: loading,
    isFetchingNextPage
  } = useInfiniteQuery(['casts', fid], fetchCasts, {
    getNextPageParam: (lastPage) => {
      return lastPage.nextPageCursor ?? false;
    }
  });

  useEffect(() => {
    if (reachedLimit) return;
    if (loadMoreInView) {
      fetchNextPage();
    }
  }, [loadMoreInView]);

  const makeItInView = (): void => setLoadMoreInView(true);
  const makeItNotInView = (): void => setLoadMoreInView(false);

  const isLoadMoreHidden = !(hasNextPage || isFetchingNextPage);

  const LoadMore = useCallback(
    (): JSX.Element => (
      <motion.div
        className={isLoadMoreHidden ? 'hidden' : 'block'}
        viewport={{ margin: `0px 0px ${marginBottom ?? 1000}px` }}
        onViewportEnter={makeItInView}
        onViewportLeave={makeItNotInView}
      >
        <Loading className='mt-5' />
      </motion.div>
    ),
    [isLoadMoreHidden]
  );

  return { data, loading, LoadMore };
}
