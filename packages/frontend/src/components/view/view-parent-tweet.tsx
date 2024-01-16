import { Tweet } from '@components/tweet/tweet';
import { RefObject, useEffect, useMemo } from 'react';
import useSWR from 'swr';
import { fetchJSON } from '../../lib/fetch';
import { TweetResponse } from '../../lib/types/tweet';

type ViewParentTweetProps = {
  parentId: string;
  viewTweetRef: RefObject<HTMLElement>;
};

export function ViewParentTweet({
  parentId,
  viewTweetRef
}: ViewParentTweetProps): JSX.Element | null {
  const { data, isValidating: loading } = useSWR(
    `/api/tweet/${parentId}`,
    async (url) => (await fetchJSON<TweetResponse>(url)).result
  );

  const mentions = useMemo(() => {
    // Look up mentions in users object
    const resolvedMentions = data?.mentions.map((mention) => ({
      ...mention,
      username: data.users[mention.userId]?.username
    }));
    return resolvedMentions;
  }, [data]);

  useEffect(() => {
    if (!loading) viewTweetRef.current?.scrollIntoView();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.id]);

  if (!data && !loading)
    return (
      <div className='px-4 pb-2 pt-3'>
        <p
          className='rounded-2xl bg-main-sidebar-background px-1 py-3 pl-4 
                     text-light-secondary dark:text-dark-secondary'
        >
          This Cast was deleted by the Cast author.{' '}
          <a
            className='custom-underline text-main-accent'
            href='https://help.twitter.com/rules-and-policies/notices-on-twitter'
            target='_blank'
            rel='noreferrer'
          >
            Learn more
          </a>
        </p>
      </div>
    );

  return data ? (
    <>
      {data.parent && (
        <ViewParentTweet
          parentId={data.parent.id}
          viewTweetRef={viewTweetRef}
        />
      )}
      <Tweet
        parentTweet
        {...data}
        mentions={mentions || []}
        user={data.users[data.createdBy]}
      />
    </>
  ) : (
    <></>
  );
}
