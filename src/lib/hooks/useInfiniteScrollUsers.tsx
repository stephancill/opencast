/* eslint-disable react-hooks/exhaustive-deps */

import { motion } from 'framer-motion';
import { useCallback, useEffect, useState } from 'react';
import { useInfiniteQuery } from 'react-query';
import { Loading } from '../../components/ui/loading';
import { PaginatedUsersResponse } from '../paginated-reactions';

export function useInfiniteScrollUsers(
  urlBuilder: (pageParam: string | null) => string,
  options?: {
    initialSize?: number;
    stepSize?: number;
    marginBottom?: number;
    queryKey?: any[];
  }
) {
  const { initialSize, stepSize, marginBottom, queryKey } = {
    initialSize: 10,
    stepSize: 10,
    marginBottom: 100,
    queryKey: [],
    ...(options ?? {})
  };

  const [reachedLimit, setReachedLimit] = useState(false);
  const [loadMoreInView, setLoadMoreInView] = useState(false);

  const fetchData = async ({ pageParam = null }) => {
    const url = urlBuilder(pageParam);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Could not fetch the data');
    }

    const { result } = (await response.json()) as PaginatedUsersResponse;

    if (!result) {
      throw new Error('Could not fetch the data');
      return;
    }

    const { users, nextPageCursor } = result;

    return {
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
  } = useInfiniteQuery(queryKey, fetchData, {
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
