import { Tweet } from '@components/tweet/tweet';
import type { RefObject } from 'react';
import { useEffect } from 'react';
import { useQuery } from 'react-query';
import { TweetResponse } from '../../lib/types/tweet';

type ViewParentTweetProps = {
  parentId: string;
  viewTweetRef: RefObject<HTMLElement>;
};

export function ViewParentTweet({
  parentId,
  viewTweetRef
}: ViewParentTweetProps): JSX.Element | null {
  const fetchCast = async () => {
    console.log('fetching parent', parentId);

    const response = await fetch(`/api/tweet/${parentId}`);

    if (!response.ok) {
      console.log(await response.json());
      return;
    }

    const responseJson = (await response.json()) as TweetResponse;

    if (!responseJson.result) {
      console.error(responseJson.message);
    }

    const tweet = responseJson.result;

    return tweet;
  };

  const { data, isLoading: loading } = useQuery('parentTweet', fetchCast);

  useEffect(() => {
    if (!loading) viewTweetRef.current?.scrollIntoView();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.id, loading]);

  if (loading) return null;
  if (!data)
    return (
      <div className='px-4 pb-2 pt-3'>
        <p
          className='rounded-2xl bg-main-sidebar-background px-1 py-3 pl-4 
                     text-light-secondary dark:text-dark-secondary'
        >
          This Tweet was deleted by the Tweet author.{' '}
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

  return <Tweet parentTweet {...data} user={data.users[data.createdBy]} />;
}
