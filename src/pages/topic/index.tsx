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
import { useRouter } from 'next/router';
import { useEffect, useState, type ReactElement, type ReactNode } from 'react';
import useSWR from 'swr';
import { fetchJSON } from '../../lib/fetch';
import { TopicResponse } from '../../lib/types/topic';
import { populateTweetTopic, populateTweetUsers } from '../../lib/types/tweet';

export default function TopicPage(): JSX.Element {
  // Debounce
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    setEnabled(true);
  }, []);

  const {
    query: { url: topicUrlParam }
  } = useRouter();

  const topicUrl = topicUrlParam as string;

  const { data: topic, isValidating: loadingTopic } = useSWR(
    topicUrl ? `/api/topic?url=${encodeURIComponent(topicUrl)}` : null,
    async (url) => {
      const res = await fetchJSON<TopicResponse>(url);
      return res.result;
    },
    { revalidateOnFocus: false }
  );

  const {
    data,
    loading: loadingFeed,
    LoadMore
  } = useInfiniteScroll(
    (pageParam) => {
      const url = `/api/topic/feed?url=${encodeURIComponent(
        topicUrl
      )}&limit=10${pageParam ? `&cursor=${pageParam}` : ''}`;
      return url;
    },
    {
      queryKey: ['topic', topicUrl],
      enabled
    }
  );
  const { isMobile } = useWindow();

  return (
    <MainContainer>
      {
        <SEO
          title={`${
            loadingTopic ? 'Loading' : topic?.name || 'Topic not found'
          } / Opencast`}
        />
      }
      <MainHeader
        useMobileSidebar
        title={topic?.name}
        imageUrl={topic?.image}
        description={topic?.description}
        className='flex items-center justify-between'
      ></MainHeader>
      {!isMobile && <Input parentUrl={topicUrl} />}
      <section className='mt-0.5 xs:mt-0'>
        {loadingFeed ? (
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

TopicPage.getLayout = (page: ReactElement): ReactNode => (
  <ProtectedLayout>
    <MainLayout>
      <HomeLayout>{page}</HomeLayout>
    </MainLayout>
  </ProtectedLayout>
);
