/* eslint-disable react-hooks/exhaustive-deps */

import cn from 'clsx';
import { useEffect, useMemo, useState } from 'react';
import { ViewTweetStats } from '@components/view/view-tweet-stats';
import type { Tweet } from '@lib/types/tweet';
import {
  createReactionMessage,
  submitHubMessage
} from '../../lib/farcaster/utils';
import { TweetOption } from './tweet-option';
import { TweetShare } from './tweet-share';
import { ReactionType } from '@farcaster/hub-web';

type TweetStatsProps = Pick<
  Tweet,
  'userLikes' | 'userRetweets' | 'userReplies'
> & {
  reply?: boolean;
  userId: string;
  isOwner: boolean;
  tweetId: string;
  viewTweet?: boolean;
  tweetAuthorId: string;
  openModal?: () => void;
};

export function TweetStats({
  reply,
  userId,
  isOwner,
  tweetId,
  userLikes,
  viewTweet,
  userRetweets,
  userReplies: totalReplies,
  tweetAuthorId,
  openModal
}: TweetStatsProps): JSX.Element {
  const totalLikes = userLikes.length;
  const totalRetweets = userRetweets.length;

  const [{ currentReplies, currentRetweets, currentLikes }, setCurrentStats] =
    useState({
      currentReplies: totalReplies,
      currentLikes: totalLikes,
      currentRetweets: totalRetweets
    });

  useEffect(() => {
    setCurrentStats({
      currentReplies: totalReplies,
      currentLikes: totalLikes,
      currentRetweets: totalRetweets
    });
  }, [totalReplies, totalLikes, totalRetweets]);

  const replyMove = useMemo(
    () => (totalReplies > currentReplies ? -25 : 25),
    [totalReplies]
  );

  const likeMove = useMemo(
    () => (totalLikes > currentLikes ? -25 : 25),
    [totalLikes]
  );

  const tweetMove = useMemo(
    () => (totalRetweets > currentRetweets ? -25 : 25),
    [totalRetweets]
  );

  const [tweetIsLiked, setTweetIsLiked] = useState(userLikes.includes(userId));
  const [tweetIsRetweeted, setTweetIsRetweeted] = useState(
    userRetweets.includes(userId)
  );

  const isStatsVisible = !!(totalReplies || totalRetweets || totalLikes);

  return (
    <>
      {viewTweet && (
        <ViewTweetStats
          likeMove={likeMove}
          userLikes={userLikes}
          tweetMove={tweetMove}
          replyMove={replyMove}
          userRetweets={userRetweets}
          currentLikes={currentLikes}
          currentTweets={currentRetweets}
          currentReplies={currentReplies}
          isStatsVisible={isStatsVisible}
          tweetId={tweetId}
        />
      )}
      <div
        className={cn(
          'flex text-light-secondary inner:outline-none dark:text-dark-secondary',
          viewTweet ? 'justify-around py-2' : 'max-w-md justify-between'
        )}
      >
        <TweetOption
          className='hover:text-accent-blue focus-visible:text-accent-blue'
          iconClassName='group-hover:bg-accent-blue/10 group-active:bg-accent-blue/20 
                         group-focus-visible:bg-accent-blue/10 group-focus-visible:ring-accent-blue/80'
          tip='Reply'
          move={replyMove}
          stats={currentReplies}
          iconName='ChatBubbleOvalLeftIcon'
          viewTweet={viewTweet}
          onClick={openModal}
        />
        <TweetOption
          className={cn(
            'hover:text-accent-green focus-visible:text-accent-green',
            tweetIsRetweeted && 'text-accent-green [&>i>svg]:[stroke-width:2px]'
          )}
          iconClassName='group-hover:bg-accent-green/10 group-active:bg-accent-green/20
                         group-focus-visible:bg-accent-green/10 group-focus-visible:ring-accent-green/80'
          tip={tweetIsRetweeted ? 'Undo Recast' : 'Recast'}
          move={tweetMove}
          stats={currentRetweets}
          iconName='ArrowPathRoundedSquareIcon'
          viewTweet={viewTweet}
          onClick={async () => {
            const message = await createReactionMessage({
              castHash: tweetId,
              castAuthorFid: parseInt(tweetAuthorId),
              fid: parseInt(userId),
              type: ReactionType.RECAST,
              remove: tweetIsRetweeted
            });
            if (!message) {
              console.error('Error creating recast message');
              return;
            }
            const result = await submitHubMessage(message);
            if (result?.hash) {
              setCurrentStats({
                currentReplies,
                currentLikes,
                currentRetweets: tweetIsRetweeted
                  ? totalRetweets - 1
                  : totalRetweets + 1
              });
              setTweetIsRetweeted(!tweetIsRetweeted);
            }
          }}
        />
        <TweetOption
          className={cn(
            'hover:text-accent-pink focus-visible:text-accent-pink',
            tweetIsLiked && 'text-accent-pink [&>i>svg]:fill-accent-pink'
          )}
          iconClassName='group-hover:bg-accent-pink/10 group-active:bg-accent-pink/20
                         group-focus-visible:bg-accent-pink/10 group-focus-visible:ring-accent-pink/80'
          tip={tweetIsLiked ? 'Unlike' : 'Like'}
          move={likeMove}
          stats={currentLikes}
          iconName='HeartIcon'
          viewTweet={viewTweet}
          onClick={async () => {
            const message = await createReactionMessage({
              castHash: tweetId,
              castAuthorFid: parseInt(tweetAuthorId),
              fid: parseInt(userId),
              type: ReactionType.LIKE,
              remove: tweetIsLiked
            });
            if (!message) {
              console.error('Error creating like message');
              return;
            }
            const result = await submitHubMessage(message);
            if (result?.hash) {
              setCurrentStats({
                currentReplies,
                currentRetweets: currentRetweets,
                currentLikes: tweetIsLiked ? totalLikes - 1 : totalLikes + 1
              });
              setTweetIsLiked(!tweetIsLiked);
            }
          }}
        />
        <TweetShare userId={userId} tweetId={tweetId} viewTweet={viewTweet} />
      </div>
    </>
  );
}
