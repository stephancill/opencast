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
import { GetServerSideProps } from 'next';
import { useState, type ReactElement, type ReactNode, useEffect } from 'react';
import { resolveTopic } from '../../lib/topics/resolve-topic';
import { TopicType } from '../../lib/types/topic';
import { useAuth } from '../../lib/context/auth-context';
import { populateTweetTopic, populateTweetUsers } from '../../lib/types/tweet';

interface TopicPageProps {
  topicUrl: string;
  topic: TopicType;
}

export const getServerSideProps: GetServerSideProps<TopicPageProps> = async ({
  query
}) => {
  if (!query?.url) {
    return {
      notFound: true
    };
  }

  const topicUrl = query.url as string;

  const topic = await resolveTopic(topicUrl);

  if (!topic) {
    return {
      notFound: true
    };
  }

  return {
    props: { topicUrl: topicUrl, topic: topic }
  };
};
export default function TopicPage({
  topicUrl: topicUrl,
  topic: topic
}: TopicPageProps): JSX.Element {
  // Debounce
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    setEnabled(true);
  }, []);

  const { data, loading, LoadMore } = useInfiniteScroll(
    (pageParam) => {
      const url = `/api/topic?url=${topicUrl}&limit=10${
        pageParam ? `&cursor=${pageParam}` : ''
      }`;
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
      <SEO title={`${topic.name} / Twitter`} />
      <MainHeader
        useMobileSidebar
        title={`${topic.name}`}
        imageUrl={topic.image}
        description={topic.description}
        className='flex items-center justify-between'
      ></MainHeader>
      {!isMobile && <Input parentUrl={topicUrl} />}
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

TopicPage.getLayout = (page: ReactElement): ReactNode => (
  <ProtectedLayout>
    <MainLayout>
      <HomeLayout>{page}</HomeLayout>
    </MainLayout>
  </ProtectedLayout>
);
