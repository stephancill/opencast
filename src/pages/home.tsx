import { SEO } from '@components/common/seo';
import { MainContainer } from '@components/home/main-container';
import { MainHeader } from '@components/home/main-header';
import { Input } from '@components/input/input';
import { HomeLayout, ProtectedLayout } from '@components/layout/common-layout';
import { MainLayout } from '@components/layout/main-layout';
import { useWindow } from '@lib/context/window-context';
import { useState, type ReactElement, type ReactNode } from 'react';
import { TweetFeed } from '../components/feed/tweet-feed';
import { FeedOrderingSelector } from '../components/ui/feed-ordering-selector';
import { useAuth } from '../lib/context/auth-context';
import { FeedOrderingType } from '../lib/types/feed';

export default function Home(): JSX.Element {
  const { isMobile } = useWindow();
  const { user, userNotifications } = useAuth();

  const [feedOrdering, setFeedOrdering] = useState<FeedOrderingType>('latest');

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
      ></MainHeader>
      <FeedOrderingSelector {...{ feedOrdering, setFeedOrdering }} />
      {!isMobile && <Input />}
      <TweetFeed
        feedOrdering={feedOrdering}
        apiEndpoint={`/api/feed?fid=${user?.id}`}
      />
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
