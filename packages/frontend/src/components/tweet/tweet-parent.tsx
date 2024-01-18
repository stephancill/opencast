import { useMemo, useEffect } from 'react';
import { getRandomId } from '@lib/random';
import { Tweet } from './tweet';
import type { LoadedParents } from './tweet-with-parent';
import useSWR from 'swr';
import { fetchJSON } from '../../lib/fetch';
import { TweetResponse, populateTweetUsers } from '../../lib/types/tweet';

type TweetParentProps = {
  parentId: string;
  loadedParents: LoadedParents;
  addParentId: (parentId: string, componentId: string) => void;
};

export function TweetParent({
  parentId,
  addParentId
}: TweetParentProps): JSX.Element | null {
  const componentId = useMemo(getRandomId, []);

  const { data, isValidating: loading } = useSWR(
    `/api/tweet/${parentId}`,
    async (url) => (await fetchJSON<TweetResponse>(url)).result,
    { revalidateOnFocus: false, revalidateOnReconnect: false }
  );

  useEffect(() => {
    addParentId(parentId, componentId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const skeletonClass = `animate-pulse bg-light-secondary dark:bg-dark-secondary`;

  if (loading || !data)
    return (
      <div className={`flex h-32 gap-x-3 px-4 pt-3`}>
        <div className='flex flex-col items-center'>
          <div
            className={`mb-2 h-12 w-12 flex-shrink-0 flex-grow-0 rounded-full ${skeletonClass}`}
          ></div>
          <i className='hover-animation h-full w-0.5 bg-light-line-reply dark:bg-dark-line-reply' />
        </div>
        <div className={`h-20 w-full rounded-md ${skeletonClass}`}></div>
      </div>
    );

  return (
    <Tweet
      parentTweet
      {...populateTweetUsers(data, data.users)}
      user={data.users[data.createdBy]!}
    />
  );
}
