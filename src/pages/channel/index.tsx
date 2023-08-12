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
import type { ReactElement, ReactNode } from 'react';
import { ChannelType, resolveChannel } from '../../lib/channel/resolve-channel';
import { useAuth } from '../../lib/context/auth-context';
import { populateTweetUsers } from '../../lib/types/tweet';

interface ChannelPageProps {
  channelString: string;
  channel: ChannelType;
}

export const getServerSideProps: GetServerSideProps<ChannelPageProps> = async ({
  query
}) => {
  if (!query?.url) {
    return {
      notFound: true
    };
  }

  const channelString = query.url as string;

  const channel = await resolveChannel(channelString);

  if (!channel) {
    return {
      notFound: true
    };
  }

  return {
    props: { channelString: channelString, channel }
  };
};
export default function ChannelPage({
  channelString,
  channel
}: ChannelPageProps): JSX.Element {
  const { user } = useAuth();
  const { data, loading, LoadMore } = useInfiniteScroll(
    (pageParam) => {
      const url = `/api/channel?url=${channelString}&limit=10${
        pageParam ? `&cursor=${pageParam}` : ''
      }`;
      return url;
    },
    {
      queryKey: ['channel', channelString]
    }
  );
  const { isMobile } = useWindow();

  return (
    <MainContainer>
      <SEO title={`${channel.name} / Twitter`} />
      <MainHeader
        useMobileSidebar
        title={`${channel.name}`}
        description={channel.description}
        className='flex items-center justify-between'
      ></MainHeader>
      {!isMobile && <Input parentUrl={channelString} />}
      <section className='mt-0.5 xs:mt-0'>
        {loading ? (
          <Loading className='mt-5' />
        ) : !data ? (
          <Error message='Something went wrong' />
        ) : (
          <>
            {data.pages.map((page) => {
              if (!page) return;
              const { tweets, users } = page;
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
            <LoadMore />
          </>
        )}
      </section>
    </MainContainer>
  );
}

ChannelPage.getLayout = (page: ReactElement): ReactNode => (
  <ProtectedLayout>
    <MainLayout>
      <HomeLayout>{page}</HomeLayout>
    </MainLayout>
  </ProtectedLayout>
);
