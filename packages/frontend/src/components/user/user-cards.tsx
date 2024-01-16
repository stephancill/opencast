import cn from 'clsx';
import { StatsEmpty } from '@components/tweet/stats-empty';
import { Loading } from '@components/ui/loading';
import { UserCard } from './user-card';
import type { User } from '@lib/types/user';
import type { StatsType } from '@components/view/view-tweet-stats';
import type { StatsEmptyProps } from '@components/tweet/stats-empty';

type FollowType = 'following' | 'followers';

type CombinedTypes = StatsType | FollowType;

type UserCardsProps = {
  data: User[] | null;
  type: CombinedTypes;
  follow?: boolean;
  loading: boolean;
  LoadMore?: () => JSX.Element;
};

type NoStatsData = Record<CombinedTypes, StatsEmptyProps>;

const allNoStatsData: Readonly<NoStatsData> = {
  retweets: {
    title: 'Amplify Casts you like',
    imageData: { src: '/assets/no-retweets.png', alt: 'No recasts' },
    description:
      'Share someone else’s Cast on your timeline by Retweeting it. When you do, it’ll show up here.'
  },
  likes: {
    title: 'No Cast Likes yet',
    imageData: { src: '/assets/no-likes.png', alt: 'No likes' },
    description: 'When you like a Cast, it’ll show up here.'
  },
  following: {
    title: 'Be in the know',
    description:
      'Following accounts is an easy way to curate your timeline and know what’s happening with the topics and people you’re interested in.'
  },
  followers: {
    title: 'Looking for followers?',
    imageData: { src: '/assets/no-followers.png', alt: 'No followers' },
    description:
      'When someone follows this account, they’ll show up here. Tweeting and interacting with others helps boost followers.'
  }
};

export function UserCards({
  data,
  type,
  follow,
  loading,
  LoadMore
}: UserCardsProps): JSX.Element {
  const noStatsData = allNoStatsData[type];
  const modal = ['retweets', 'likes'].includes(type);

  return (
    <section
      className={cn(
        modal && 'h-full overflow-y-auto [&>div:first-child>a]:mt-[52px]',
        loading && 'flex items-center justify-center'
      )}
    >
      {loading ? (
        <Loading className={modal ? 'mt-[52px]' : 'mt-5'} />
      ) : (
        <div className='mt-10'>
          {data?.length ? (
            data.map((userData) => (
              <div key={userData.id}>
                <UserCard {...userData} follow={follow} modal={modal} />
              </div>
            ))
          ) : (
            <StatsEmpty {...noStatsData} modal={modal} />
          )}
          {LoadMore && <LoadMore />}
        </div>
      )}
    </section>
  );
}
