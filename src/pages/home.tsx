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
import { useInfiniteScroll } from '@lib/hooks/useInfiniteScroll';
import { useState, type ReactElement, type ReactNode, useEffect } from 'react';
import { useAuth } from '../lib/context/auth-context';
import { populateTweetTopic, populateTweetUsers } from '../lib/types/tweet';

export default function Home(): JSX.Element {
  // Debounce
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    setEnabled(true);
  }, []);

  const { user } = useAuth();
  const { data, loading, LoadMore } = useInfiniteScroll(
    (pageParam) => {
      const url = `/api/feed?fid=${user?.id}&limit=10${
        pageParam ? `&cursor=${pageParam}` : ''
      }`;
      return url;
    },
    {
      queryKey: ['feed', user?.id],
      enabled,
      refetchOnFocus: false
    }
  );
  const { isMobile } = useWindow();

  return (
    <MainContainer>
      <SEO title='Home / Twitter' />
      <MainHeader
        useMobileSidebar
        title='Home'
        className='flex items-center justify-between'
      >
        {/* <UpdateUsername /> */}
      </MainHeader>
      {!isMobile && <Input />}
      <section className='mt-0.5 xs:mt-0'>
        {loading ? (
          <Loading className='mt-5' />
        ) : !data ? (
          <Error message='Something went wrong' />
        ) : (
          <>
            {data.pages.map((page) => {
              if (!page) return;
              const { tweets, users, topics } = page;
              return tweets.map((tweet) => {
                if (!users[tweet.createdBy]) {
                  return <></>;
                }

                return (
                  <Tweet
                    {...populateTweetTopic(
                      populateTweetUsers(tweet, users),
                      topics
                    )}
                    user={users[tweet.createdBy]}
                    key={tweet.id}
                  />
                );
              });
            })}
            <LoadMore />
          </>
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
