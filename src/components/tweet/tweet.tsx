import { ImagePreview } from '@components/input/image-preview';
import { Modal } from '@components/modal/modal';
import { TweetReplyModal } from '@components/modal/tweet-reply-modal';
import { UserAvatar } from '@components/user/user-avatar';
import { UserName } from '@components/user/user-name';
import { UserTooltip } from '@components/user/user-tooltip';
import { UserUsername } from '@components/user/user-username';
import { useAuth } from '@lib/context/auth-context';
import { useModal } from '@lib/hooks/useModal';
import type { Tweet } from '@lib/types/tweet';
import type { User } from '@lib/types/user';
import cn from 'clsx';
import type { Variants } from 'framer-motion';
import { AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useMemo } from 'react';
import { calculateMatchFactor } from '../../lib/interests/interest-match';
import { TweetActions } from './tweet-actions';
import { TweetDate } from './tweet-date';
import { TweetEmbeds } from './tweet-embed';
import { TweetStats } from './tweet-stats';
import { TweetStatus } from './tweet-status';
import { TweetText } from './tweet-text';
import { TweetTopic } from './tweet-topic';

export type TweetProps = Tweet & {
  user: User;
  modal?: boolean;
  pinned?: boolean;
  profile?: User | null;
  parentTweet?: boolean;
};

export const variants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.8 } },
  exit: { opacity: 0, transition: { duration: 0.2 } }
};

export function Tweet(tweet: TweetProps): JSX.Element {
  const {
    id: tweetId,
    text,
    modal,
    images,
    parent,
    pinned,
    profile,
    userLikes,
    createdBy,
    createdAt,
    parentTweet,
    userReplies,
    userRetweets,
    mentions,
    topic,
    retweet,
    embeds,
    user: tweetUserData
  } = tweet;

  const { id: ownerId, name, username, verified, photoURL } = tweetUserData;

  const { user: currentUser } = useAuth();

  const { open, openModal, closeModal } = useModal();

  const tweetLink = `/tweet/${tweetId}`;

  const userId = currentUser?.id as string;

  const isOwner = userId === createdBy;

  const { id: parentId, username: parentUsername = username } = parent ?? {};

  const { push } = useRouter();

  const {
    id: profileId,
    name: profileName,
    username: profileUsername
  } = profile ?? {};

  const reply = !!parent;
  const tweetIsRetweeted = retweet !== null;

  const userMatchFactor = useMemo(
    () =>
      currentUser
        ? calculateMatchFactor(currentUser?.interests, tweetUserData.interests)
        : 0,
    [currentUser, tweetUserData]
  );

  return (
    <article>
      <Modal
        className='flex items-start justify-center'
        modalClassName='bg-main-background rounded-2xl max-w-xl w-full my-8 overflow-hidden'
        open={open}
        closeModal={closeModal}
      >
        <TweetReplyModal tweet={tweet} closeModal={closeModal} />
      </Modal>
      <div
        className={cn(
          `accent-tab sm:hover-card relative flex cursor-pointer 
             flex-col gap-y-4 px-4 py-3 outline-none duration-200`,
          parentTweet
            ? 'mt-0.5 pb-0 pt-2.5'
            : 'border-b border-light-border dark:border-dark-border'
        )}
        onClick={(event) => {
          // Prevent click when clicking on a link or a paragraph or image
          const tagName = (event.target as any).tagName;
          if (
            tagName === 'A' ||
            tagName === 'SPAN' ||
            tagName === 'P' ||
            tagName === 'IMG'
          ) {
            event.stopPropagation();
            return;
          }

          // Prevent click when selecting text
          const text = window.getSelection()?.toString();
          if (text) {
            event.stopPropagation();
            return;
          }

          push(tweetLink);
        }}
      >
        <div className='grid grid-cols-[auto,1fr] gap-x-3 gap-y-1'>
          <AnimatePresence initial={false}>
            {modal ? null : pinned ? (
              <TweetStatus type='pin'>
                <p className='text-sm font-bold'>Pinned Cast</p>
              </TweetStatus>
            ) : (
              tweetIsRetweeted &&
              retweet.username && (
                <TweetStatus type='tweet'>
                  <Link href={retweet.username as string}>
                    <a className='custom-underline truncate text-sm font-bold'>
                      {retweet.userId === profileId ? 'You' : retweet.username}{' '}
                      Retweeted
                    </a>
                  </Link>
                </TweetStatus>
              )
            )}
          </AnimatePresence>
          <div className='flex flex-col items-center gap-2'>
            <UserTooltip avatar modal={modal} {...tweetUserData}>
              <UserAvatar src={photoURL} alt={name} username={username} />
            </UserTooltip>
            {parentTweet && (
              <i className='hover-animation h-full w-0.5 bg-light-line-reply dark:bg-dark-line-reply' />
            )}
          </div>
          <div className='flex min-w-0 flex-col'>
            {currentUser && userMatchFactor > 0 && (
              <div
                style={{
                  width: `${userMatchFactor * 100}%`,
                  height: `3px`,
                  backgroundColor: `hsla(204, 88%, 53%, ${
                    userMatchFactor + 10
                  })`
                }}
                className='mr-1 inline rounded-full'
                title={userMatchFactor.toFixed(2)}
              ></div>
            )}
            <div className='flex justify-between gap-2 text-light-secondary dark:text-dark-secondary'>
              <div className='flex gap-1 truncate xs:overflow-visible xs:whitespace-normal'>
                <UserTooltip modal={modal} {...tweetUserData}>
                  <span className='flex items-center'>
                    <UserName
                      name={name}
                      username={username}
                      verified={verified}
                      className='text-light-primary dark:text-dark-primary'
                    />
                  </span>
                </UserTooltip>

                <UserTooltip modal={modal} {...tweetUserData}>
                  <UserUsername username={username} />
                </UserTooltip>
                <TweetDate tweetLink={tweetLink} createdAt={createdAt} />
              </div>
              <div className='px-4'>
                {!modal && (
                  <TweetActions
                    isOwner={isOwner}
                    ownerId={ownerId}
                    tweetId={tweetId}
                    parentId={parentId}
                    username={username}
                    hasImages={!!images}
                    createdBy={createdBy}
                  />
                )}
              </div>
            </div>
            {(reply || modal) && (
              <p
                className={cn(
                  'text-light-secondary dark:text-dark-secondary',
                  modal && 'order-1 my-2'
                )}
              >
                Replying to{' '}
                <Link href={`/user/${parentUsername}`}>
                  <a className='custom-underline text-main-accent'>
                    @{parentUsername}
                  </a>
                </Link>
              </p>
            )}
            <div className='whitespace-pre-line break-words'>
              <TweetText
                text={text || ''}
                images={images}
                mentions={mentions}
              />
            </div>
            <div className='mt-1 flex flex-col gap-2'>
              {images && (
                <ImagePreview
                  tweet
                  imagesPreview={images}
                  previewCount={images.length}
                />
              )}
              {embeds && embeds.length > 0 && <TweetEmbeds embeds={embeds} />}
              {topic && <TweetTopic topic={topic} />}
              {!modal && (
                <TweetStats
                  reply={reply}
                  userId={userId}
                  isOwner={isOwner}
                  tweetId={tweetId}
                  userLikes={userLikes}
                  userReplies={userReplies}
                  userRetweets={userRetweets}
                  tweetAuthorId={ownerId}
                  openModal={!parent ? openModal : undefined}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
