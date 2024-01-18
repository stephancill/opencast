import useSWR from 'swr';
import useSWRInfinite from 'swr/infinite';
import { useAuth } from '../../lib/context/auth-context';
import {
  PaginatedTweetsResponse,
  TweetsResponse
} from '../../lib/paginated-tweets';
import { FeedOrderingType } from '../../lib/types/feed';
import { populateTweetUsers } from '../../lib/types/tweet';
import { isPlural } from '../../lib/utils';
import { LoadMoreSentinel } from '../common/load-more';
import { Tweet } from '../tweet/tweet';
import { Error } from '../ui/error';
import { Loading } from '../ui/loading';

interface TweetFeedProps {
  feedOrdering: FeedOrderingType;
  apiEndpoint: string;
}

export function TweetFeed({ feedOrdering, apiEndpoint }: TweetFeedProps) {
  const { user, timelineCursor, setTimelineCursor } = useAuth();

  const {
    data: pages,
    size,
    setSize,
    isValidating: loading
  } = useSWRInfinite<PaginatedTweetsResponse>(
    (pageIndex, prevPage) => {
      if (!user || !timelineCursor) return null;

      if (prevPage && !prevPage.result?.nextPageCursor) return null;

      const baseUrl = `${apiEndpoint}&limit=10&full=true&cursor=${timelineCursor.toISOString()}&ordering=${feedOrdering}`;

      if (pageIndex === 0) {
        return `${baseUrl}&skip=0`;
      }

      if (!prevPage?.result) return null;

      return `${baseUrl}&skip=${prevPage.result.nextPageCursor}`;
    },
    {
      revalidateOnFocus: false,
      revalidateFirstPage: false
    }
  );
  const hasMore = !!pages?.[size - 1]?.result?.tweets.length;

  // Fetch new tweets every 20 seconds
  const { data: newPage } = useSWR<TweetsResponse>(
    !!pages && timelineCursor && feedOrdering === 'latest'
      ? `${apiEndpoint}&cursor=${timelineCursor.toISOString()}&limit=100&after=true`
      : null,
    null,
    { refreshInterval: 10_000 }
  );

  const onShowNewTweets = () => {
    if (!newPage?.result?.tweets) return;
    const cursor = new Date();
    setTimelineCursor(cursor);
  };

  return (
    <section className='mt-0.5 xs:mt-0'>
      <>
        {newPage?.result?.tweets && (newPage.result.tweets.length || 0) > 0 && (
          <button
            className='custom-button accent-tab hover-card border-bottom block w-full cursor-pointer rounded-none
      border-b border-t-0 border-light-border text-center text-main-accent dark:border-dark-border'
            onClick={onShowNewTweets}
          >
            Show {newPage.result.tweets.length} new cast
            {isPlural(newPage.result.tweets.length) ? 's' : ''}
          </button>
        )}
        {pages?.map(({ result }) => {
          if (!result) return [];
          const { tweets, users } = result;
          return tweets.map((tweet) => {
            if (!users[tweet.createdBy]) {
              return <></>;
            }

            return (
              <Tweet
                {...populateTweetUsers(tweet, users)}
                user={users[tweet.createdBy]!}
                key={tweet.id}
              />
            );
          });
        })}
        {hasMore && (
          <LoadMoreSentinel
            loadMore={() => {
              setSize(size + 1);
            }}
            isLoading={loading}
          ></LoadMoreSentinel>
        )}
      </>
      {loading ? (
        <Loading className='mt-5' />
      ) : (
        !pages && <Error message='Something went wrong' />
      )}
    </section>
  );
}
