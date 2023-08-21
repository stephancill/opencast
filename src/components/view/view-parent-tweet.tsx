import { Tweet } from '@components/tweet/tweet';
import { RefObject, useMemo } from 'react';
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
    const response = await fetch(`/api/tweet/${parentId}`);

    if (!response.ok) {
      console.error(await response.json());
      return;
    }

    const responseJson = (await response.json()) as TweetResponse;

    if (!responseJson.result) {
      console.error(responseJson.message);
    }

    const tweet = responseJson.result;

    return tweet;
  };

  const { data, isLoading: loading } = useQuery(
    ['parentTweet', parentId],
    fetchCast
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
  }, [data?.id, loading]);

  if (loading) return null;
  if (!data)
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

  return (
    <Tweet
      parentTweet
      {...data}
      mentions={mentions || []}
      user={data.users[data.createdBy]}
    />
  );
}
