import { SEO } from '@components/common/seo';
import { MainContainer } from '@components/home/main-container';
import { MainHeader } from '@components/home/main-header';
import { Input } from '@components/input/input';
import { HomeLayout, ProtectedLayout } from '@components/layout/common-layout';
import { MainLayout } from '@components/layout/main-layout';
import { Tweet } from '@components/tweet/tweet';
import { Error } from '@components/ui/error';
import { Loading } from '@components/ui/loading';
import { useWindow } from '@lib/context/window-context';
import { type ReactElement, type ReactNode } from 'react';
import useSWR from 'swr';
import useSWRInfinite from 'swr/infinite';
import { LoadMoreSentinel } from '../components/common/load-more';
import { useAuth } from '../lib/context/auth-context';
import {
  PaginatedTweetsResponse,
  TweetsResponse
} from '../lib/paginated-tweets';
import { populateTweetUsers } from '../lib/types/tweet';
import { isPlural } from '../lib/utils';

const cursorKey = 'homeFeedCursor';

export default function Home(): JSX.Element {
  const { isMobile } = useWindow();
  const { user, userNotifications, timelineCursor, setTimelineCursor } =
    useAuth();

  const {
    data: pages,
    size,
    setSize,
    isValidating: loading,
    error
  } = useSWRInfinite<PaginatedTweetsResponse>(
    (pageIndex, prevPage) => {
      if (!user || !timelineCursor) return null;

      if (prevPage && !prevPage.result?.nextPageCursor) return null;

      const baseUrl = `/api/feed?fid=${user?.id}&limit=10&full=true`;

      if (pageIndex === 0) {
        return `${baseUrl}&cursor=${timelineCursor.toISOString()}`;
      }

      if (!prevPage?.result) return null;

      return `${baseUrl}&cursor=${prevPage.result.nextPageCursor}`;
    },
    {
      revalidateOnFocus: false,
      revalidateFirstPage: false
    }
  );
  const hasMore = !!pages?.[size - 1]?.result?.tweets.length;

  // Fetch new tweets every 20 seconds
  const { data: newPage } = useSWR<TweetsResponse>(
    !!pages && timelineCursor
      ? `/api/feed?fid=${
          user?.id
        }&cursor=${timelineCursor.toISOString()}&limit=100&after=true`
      : null,
    null,
    { refreshInterval: 1000 }
  );

  const onShowNewTweets = () => {
    if (!newPage?.result?.tweets) return;
    const cursor = new Date();
    setTimelineCursor(cursor);
  };

  return (
    <MainContainer>
      <SEO
        title={`${
          userNotifications ? `(${userNotifications}) ` : ''
        }Home / Opencast`}
      />
      <MainHeader
        useMobileSidebar
        title='Home'
        className='flex items-center justify-between'
      >
        {/* <UpdateUsername /> */}
      </MainHeader>
      {!isMobile && <Input />}
      <section className='mt-0.5 xs:mt-0'>
        <>
          {newPage?.result?.tweets &&
            (newPage.result.tweets.length || 0) > 0 && (
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
            if (!result) return;
            const { tweets, users } = result;
            return tweets.map((tweet) => {
              if (!users[tweet.createdBy]) {
                return <></>;
              }

              return (
                <Tweet
                  {...populateTweetUsers(tweet, users)}
                  user={users[tweet.createdBy]}
                  key={tweet.id}
                />
              );
            });
          })}
          {hasMore && (
            // <button onClick={() => setSize(size + 1)}>Load more</button>
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
    </MainContainer>
  );
}

Home.getLayout = (page: ReactElement): ReactNode => (
  <ProtectedLayout>
    <MainLayout>
      <HomeLayout>{page}</HomeLayout>
    </MainLayout>
  </ProtectedLayout>
);
