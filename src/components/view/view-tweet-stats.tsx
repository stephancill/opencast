import { Modal } from '@components/modal/modal';
import { TweetStatsModal } from '@components/modal/tweet-stats-modal';
import { NumberStats } from '@components/tweet/number-stats';
import { UserCards } from '@components/user/user-cards';
import { ReactionType } from '@farcaster/hub-web';
import { useModal } from '@lib/hooks/useModal';
import type { Tweet } from '@lib/types/tweet';
import cn from 'clsx';
import { useState } from 'react';
import { useInfiniteScrollUsers } from '../../lib/hooks/useInfiniteScrollUsers';
import { User } from '../../lib/types/user';

type viewTweetStats = Pick<Tweet, 'userRetweets' | 'userLikes'> & {
  likeMove: number;
  tweetMove: number;
  replyMove: number;
  currentLikes: number;
  currentTweets: number;
  currentReplies: number;
  isStatsVisible: boolean;
  tweetId: string;
};

export type StatsType = 'retweets' | 'likes';

type Stats = [string, StatsType | null, number, number];

export function ViewTweetStats({
  likeMove,
  userLikes,
  tweetMove,
  replyMove,
  userRetweets,
  currentLikes,
  currentTweets,
  currentReplies,
  isStatsVisible,
  tweetId
}: viewTweetStats): JSX.Element {
  const [statsType, setStatsType] = useState<StatsType | null>(null);

  const { open, openModal, closeModal } = useModal();

  const { data, loading, LoadMore } = useInfiniteScrollUsers(
    (pageParam) => {
      return `/api/tweet/${tweetId}/engagers?type=${
        statsType === 'likes' ? ReactionType.LIKE : ReactionType.RECAST
      }&limit=10${pageParam ? `&cursor=${pageParam}` : ''}`;
    },
    {
      queryKey: [statsType, tweetId]
    }
  );

  const handleOpen = (type: StatsType) => (): void => {
    setStatsType(type);
    openModal();
  };

  const handleClose = (): void => {
    setStatsType(null);
    closeModal();
  };

  const allStats: Readonly<Stats[]> = [
    ['Reply', null, replyMove, currentReplies],
    ['Retweet', 'retweets', tweetMove, currentTweets],
    ['Like', 'likes', likeMove, currentLikes]
  ];

  return (
    <>
      <Modal
        modalClassName='relative bg-main-background rounded-2xl max-w-xl w-full 
                        h-[672px] overflow-hidden rounded-2xl'
        open={open}
        closeModal={handleClose}
      >
        <TweetStatsModal statsType={statsType} handleClose={handleClose}>
          <UserCards
            follow
            type={statsType as StatsType}
            data={
              (data?.pages
                .map((page) => page?.users)
                .flat()
                .filter((user) => user !== undefined) as User[]) ?? []
            }
            loading={loading}
            LoadMore={LoadMore}
          />
        </TweetStatsModal>
      </Modal>
      {isStatsVisible && (
        <div
          className='flex gap-4 px-1 py-4 text-light-secondary dark:text-dark-secondary
                     [&>button>div]:font-bold [&>button>div]:text-light-primary 
                     dark:[&>button>div]:text-dark-primary'
        >
          {allStats.map(
            ([title, type, move, stats], index) =>
              !!stats && (
                <button
                  className={cn(
                    `hover-animation mb-[3px] mt-0.5 flex h-4 items-center gap-1 border-b 
                     border-b-transparent outline-none hover:border-b-light-primary 
                     focus-visible:border-b-light-primary dark:hover:border-b-dark-primary
                     dark:focus-visible:border-b-dark-primary`,
                    index === 0 && 'cursor-not-allowed'
                  )}
                  key={title}
                  onClick={type ? handleOpen(type) : undefined}
                >
                  <NumberStats move={move} stats={stats} />
                  <p>{`${
                    stats === 1
                      ? title
                      : stats > 1 && index === 0
                      ? `${title.slice(0, -1)}ies`
                      : `${title}s`
                  }`}</p>
                </button>
              )
          )}
        </div>
      )}
    </>
  );
}
