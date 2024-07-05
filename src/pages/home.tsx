import { SEO } from '@components/common/seo';
import { MainContainer } from '@components/home/main-container';
import { MainHeader } from '@components/home/main-header';
import { Input } from '@components/input/input';
import { HomeLayout, ProtectedLayout } from '@components/layout/common-layout';
import { MainLayout } from '@components/layout/main-layout';
import { useWindow } from '@lib/context/window-context';
import { useState, type ReactElement, type ReactNode } from 'react';
import useSWR from 'swr';
import { TweetFeed } from '../components/feed/tweet-feed';
import { FeedOrderingSelector } from '../components/ui/feed-ordering-selector';
import { UserAvatar } from '../components/user/user-avatar';
import { useAuth } from '../lib/context/auth-context';
import { fetchJSON } from '../lib/fetch';
import { FeedOrderingType } from '../lib/types/feed';
import { OnlineUsersResponse } from '../lib/types/online';
import { NextImage } from '../components/ui/next-image';

export default function Home(): JSX.Element {
  const { isMobile } = useWindow();
  const { user, userNotifications } = useAuth();

  const { data: onlineUsers, isValidating: onlineUsersLoading } = useSWR(
    `/api/online?fid=${user?.id}`,
    async (url) => (await fetchJSON<OnlineUsersResponse>(url)).result,
    { revalidateOnFocus: false, refreshInterval: 10_000 }
  );

  const [feedOrdering, setFeedOrdering] = useState<FeedOrderingType>('latest');

  return (
    <MainContainer>
      <SEO
        title={`${
          userNotifications && user?.keyPair ? `(${userNotifications}) ` : ''
        }Home / Opencast`}
      />
      <MainHeader
        useMobileSidebar
        title='Home'
        className='flex items-center justify-between'
      ></MainHeader>
      <div className='overflow-scroll'>
        <div>
          {onlineUsersLoading && !onlineUsers && (
            <div className='p-1'>
              <NextImage
                useSkeleton
                className='overflow-hidden rounded-full'
                imgClassName='rounded-full !h-full !w-full'
                width={64}
                height={64}
                src={''}
                alt={''}
                key={'loading'}
              />
            </div>
          )}

          <div className='flex gap-2 px-2'>
            {onlineUsers && onlineUsers.length === 0 && (
              <div>No users online</div>
            )}
            {onlineUsers &&
              onlineUsers.map(({ user }) => (
                <div key={user.id} className='p-1'>
                  <div className='relative rounded-full bg-gradient-to-r from-blue-500 to-purple-500 p-[2px]'>
                    <div className='relative rounded-full bg-white'>
                      <UserAvatar
                        username={user.username}
                        src={user.photoURL}
                        alt={user.name}
                        size={64}
                      />
                      <div className='absolute bottom-0.5 right-0.5 h-2 w-2 rounded-full bg-green-500'></div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
      <FeedOrderingSelector {...{ feedOrdering, setFeedOrdering }} />
      {!isMobile && user?.keyPair && <Input />}
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
