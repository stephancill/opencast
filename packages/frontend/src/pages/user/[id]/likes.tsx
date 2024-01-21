import { SEO } from '@components/common/seo';
import { ProtectedLayout, UserLayout } from '@components/layout/common-layout';
import { MainLayout } from '@components/layout/main-layout';
import { UserDataLayout } from '@components/layout/user-data-layout';
import { UserHomeLayout } from '@components/layout/user-home-layout';
import { StatsEmpty } from '@components/tweet/stats-empty';
import { Tweet } from '@components/tweet/tweet';
import { Loading } from '@components/ui/loading';
import { useUser } from '@lib/context/user-context';
import { useEffect, useState, type ReactElement, type ReactNode } from 'react';
import { useInfiniteScroll } from '@lib/hooks/useInfiniteScroll';
import { populateTweetUsers } from '@lib/types/tweet';

export default function UserLikes(): JSX.Element {
  const { user } = useUser();

  // Debounce
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    setEnabled(true);
  }, []);

  const { id, username, name } = user ?? {};
  const { data, loading, LoadMore } = useInfiniteScroll(
    (pageParam) =>
      `/api/user/${id}/likes?limit=10${
        pageParam ? `&cursor=${pageParam}` : ''
      }`,
    { marginBottom: 20, queryKey: ['user', 'likes', id], enabled }
  );

  return (
    <section>
      <SEO
        title={`Tweets liked by ${name as string} (@${
          username as string
        }) / Selekt`}
      />
      {loading ? (
        <Loading className='mt-5' />
      ) : !data ? (
        <StatsEmpty
          title={`@${username as string} hasn't liked any Tweets`}
          description='When they do, those Tweets will show up here.'
        />
      ) : (
        <div>
          {/* {pinnedData && (
            <Tweet pinned {...pinnedData} key={`pinned-${pinnedData.id}`} />
          )}
          {mergedTweets.map((tweet) => (
            <Tweet {...tweet} profile={user} key={tweet.id} />
          ))} */}
          {data.pages.map((page) => {
            if (!page) return [];
            const { tweets, users } = page;
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
          <LoadMore />
          {/* </AnimatePresence> */}
        </div>
      )}
    </section>
  );
}

UserLikes.getLayout = (page: ReactElement): ReactNode => (
  <ProtectedLayout>
    <MainLayout>
      <UserLayout>
        <UserDataLayout>
          <UserHomeLayout>{page}</UserHomeLayout>
        </UserDataLayout>
      </UserLayout>
    </MainLayout>
  </ProtectedLayout>
);
