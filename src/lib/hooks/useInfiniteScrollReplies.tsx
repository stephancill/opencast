/* eslint-disable react-hooks/exhaustive-deps */

import { motion } from 'framer-motion';
import { useCallback, useEffect, useState } from 'react';
import { useInfiniteQuery } from 'react-query';
import { Loading } from '../../components/ui/loading';
import { FeedResponse } from '../types/feed';

// TODO: Refactor this hook to be more generic
export function useInfiniteScroll(
  postId: string,
  options?: {
    initialSize?: number;
    stepSize?: number;
    marginBottom?: number;
  }
) {
  const { initialSize, stepSize, marginBottom } = options ?? {
    initialSize: 10,
    stepSize: 10,
    marginBottom: 100
  };

  const [reachedLimit, setReachedLimit] = useState(false);
  const [loadMoreInView, setLoadMoreInView] = useState(false);

  const fetchData = async ({ pageParam = null }) => {
    const response = await fetch(
      `/api/tweet/${postId}/replies?limit=${stepSize}${
        pageParam ? `&cursor=${pageParam}` : ''
      }`
    );
    if (!response.ok) {
      throw new Error('Could not fetch the casts');
    }

    const { result } = (await response.json()) as FeedResponse;

    if (!result) {
      throw new Error('Could not fetch the casts');
      return;
    }

    // Transform to tweet object
    const { tweets, users, nextPageCursor } = result;

    return {
      tweets,
      users,
      nextPageCursor
    };
  };

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isLoading: loading,
    isFetchingNextPage
  } = useInfiniteQuery(['replies', postId], fetchData, {
    getNextPageParam: (lastPage) => {
      return lastPage?.nextPageCursor ?? false;
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
