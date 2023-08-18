import { SEO } from '@components/common/seo';
import { ProtectedLayout, UserLayout } from '@components/layout/common-layout';
import { MainLayout } from '@components/layout/main-layout';
import { UserDataLayout } from '@components/layout/user-data-layout';
import { UserHomeLayout } from '@components/layout/user-home-layout';
import { StatsEmpty } from '@components/tweet/stats-empty';
import { LoadedParents } from '@components/tweet/tweet-with-parent';
import { Loading } from '@components/ui/loading';
import { useUser } from '@lib/context/user-context';
import { useEffect, useState, type ReactElement, type ReactNode } from 'react';
import { Tweet } from '../../../components/tweet/tweet';
import { TweetParent } from '../../../components/tweet/tweet-parent';
import { useInfiniteScroll } from '../../../lib/hooks/useInfiniteScroll';
import {
  populateTweetTopic,
  populateTweetUsers
} from '../../../lib/types/tweet';

export default function UserWithReplies(): JSX.Element {
  const { user } = useUser();

  // Debounce
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    setEnabled(true);
  }, []);

  const { id, username, name } = user ?? {};
  const { data, loading, LoadMore } = useInfiniteScroll(
    (pageParam) =>
      `/api/user/${id}/tweets?limit=10&replies=true${
        pageParam ? `&cursor=${pageParam}` : ''
      }`,
    {
      marginBottom: 20,
      queryKey: ['user', 'likes', id],
      enabled,
      refetchOnFocus: false
    }
  );

  const [loadedParents, setLoadedParents] = useState<LoadedParents>([]);

  const addParentId = (parentId: string, targetChildId: string): void =>
    setLoadedParents((prevLoadedParents) =>
      prevLoadedParents.some((item) => item.parentId === parentId)
        ? prevLoadedParents
        : [...prevLoadedParents, { parentId, childId: targetChildId }]
    );

  return (
    <section>
      <SEO
        title={`Tweets with replies by ${name as string} (@${
          username as string
        }) / Twitter`}
      />
      {loading ? (
        <Loading className='mt-5' />
      ) : !data ? (
        <StatsEmpty
          title={`@${username as string} hasn't tweeted`}
          description='When they do, their Tweets will show up here.'
        />
      ) : (
        <div>
          {data.pages.map((page) => {
            if (!page) return;
            const { tweets, users, topics } = page;
            return tweets.map((tweet) => {
              if (!users[tweet.createdBy]) {
                return <></>;
              }

              return (
                <div className='[&>article:nth-child(2)]:-mt-1' key={tweet.id}>
                  {tweet.parent && (
                    <TweetParent
                      parentId={tweet.parent.id}
                      loadedParents={loadedParents}
                      addParentId={addParentId}
                    />
                  )}
                  <Tweet
                    {...populateTweetTopic(
                      populateTweetUsers(tweet, users),
                      topics
                    )}
                    user={users[tweet.createdBy]}
                    key={tweet.id}
                  />
                </div>
              );
            });
          })}
          <LoadMore />
        </div>
      )}
    </section>
  );
}

UserWithReplies.getLayout = (page: ReactElement): ReactNode => (
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
