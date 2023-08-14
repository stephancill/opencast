import { ProtectedLayout, UserLayout } from '@components/layout/common-layout';
import { MainLayout } from '@components/layout/main-layout';
import { UserDataLayout } from '@components/layout/user-data-layout';
import { UserHomeLayout } from '@components/layout/user-home-layout';
import { StatsEmpty } from '@components/tweet/stats-empty';
import { Tweet } from '@components/tweet/tweet';
import { Loading } from '@components/ui/loading';
import { useUser } from '@lib/context/user-context';
import type { ReactElement, ReactNode } from 'react';
import { useInfiniteScroll } from '../../../lib/hooks/useInfiniteScroll';
import {
  populateTweetTopic,
  populateTweetUsers
} from '../../../lib/types/tweet';

export default function UserTweets(): JSX.Element {
  const { user } = useUser();

  const { id, username } = user ?? {};
  const {
    data: ownerTweets,
    loading: ownerLoading,
    LoadMore
  } = useInfiniteScroll(
    (pageParam) =>
      `/api/user/${id}/tweets?limit=10${
        pageParam ? `&cursor=${pageParam}` : ''
      }`,
    { marginBottom: 20, queryKey: ['user', id] }
  );

  // const { data: peopleTweets, loading: peopleLoading } = useCollection(
  //   query(
  //     tweetsCollection,
  //     where('createdBy', '!=', id),
  //     where('userRetweets', 'array-contains', id)
  //   ),
  //   { includeUser: true, allowNull: true }
  // );

  // const mergedTweets = mergeData(true, ownerTweets, peopleTweets);
  const mergedTweets = ownerTweets;

  return (
    <section>
      {ownerLoading ? (
        <Loading className='mt-5' />
      ) : !mergedTweets ? (
        <StatsEmpty
          title={`@${username as string} hasn't tweeted`}
          description='When they do, their Tweets will show up here.'
        />
      ) : (
        // <AnimatePresence mode='popLayout'>
        <div>
          {/* {pinnedData && (
            <Tweet pinned {...pinnedData} key={`pinned-${pinnedData.id}`} />
          )}
          {mergedTweets.map((tweet) => (
            <Tweet {...tweet} profile={user} key={tweet.id} />
          ))} */}
          {mergedTweets.pages.map((page) => {
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
          {/* </AnimatePresence> */}
        </div>
      )}
    </section>
  );
}

UserTweets.getLayout = (page: ReactElement): ReactNode => (
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
