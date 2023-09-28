import { SEO } from '@components/common/seo';
import { MainContainer } from '@components/home/main-container';
import { MainHeader } from '@components/home/main-header';
import { Input } from '@components/input/input';
import { HomeLayout, ProtectedLayout } from '@components/layout/common-layout';
import { MainLayout } from '@components/layout/main-layout';
import { useWindow } from '@lib/context/window-context';
import { useRouter } from 'next/router';
import { useEffect, useState, type ReactElement, type ReactNode } from 'react';
import useSWR from 'swr';
import { TweetFeed } from '../../components/feed/tweet-feed';
import { FeedOrderingSelector } from '../../components/ui/feed-ordering-selector';
import { fetchJSON } from '../../lib/fetch';
import { FeedOrderingType } from '../../lib/types/feed';
import { TopicResponse } from '../../lib/types/topic';

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

  const { isMobile } = useWindow();

  const [feedOrdering, setFeedOrdering] = useState<FeedOrderingType>('latest');

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
      <FeedOrderingSelector {...{ feedOrdering, setFeedOrdering }} />
      {!isMobile && <Input parentUrl={topicUrl} />}
      <TweetFeed
        apiEndpoint={`/api/feed?topic_url=${encodeURIComponent(topicUrl)}`}
        feedOrdering={feedOrdering}
      />
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
