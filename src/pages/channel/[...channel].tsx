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
import { useRouter } from 'next/router';
import type { ReactElement, ReactNode } from 'react';
import { ChannelType, resolveChannel } from '../../lib/channel/resolve-channel';
import { useAuth } from '../../lib/context/auth-context';

interface ChannelPageProps {
  channelString: string;
  channel: ChannelType;
}

export const getServerSideProps: GetServerSideProps<ChannelPageProps> = async ({
  req,
  res,
  params
}) => {
  if (!params?.channel) {
    return {
      notFound: true
    };
  }

  const channelString = (params.channel as string[])
    .join('/')
    .replace('chain:/', 'chain://');

  const channel = await resolveChannel(channelString);

  console.log(channel);

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
      const url = `/api/channel/${channelString}?limit=10${
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
      <SEO title={`${channel.properties.name} / Twitter`} />
      <MainHeader
        useMobileSidebar
        title={`${channel.properties.name}`}
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
              const { tweets, users } = page;
              return tweets.map((tweet) => {
                if (!users[tweet.createdBy]) {
                  return <></>;
                }

                // Look up username in users object
                const parent = tweet.parent;
                if (parent && !tweet.parent?.username && tweet.parent?.userId) {
                  tweet.parent.username = users[tweet.parent.userId]?.username;
                }

                return (
                  <Tweet
                    {...tweet}
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
