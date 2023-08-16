import { ImagePreview } from '@components/input/image-preview';
import { Input } from '@components/input/input';
import { Modal } from '@components/modal/modal';
import { TweetReplyModal } from '@components/modal/tweet-reply-modal';
import { TweetActions } from '@components/tweet/tweet-actions';
import { TweetDate } from '@components/tweet/tweet-date';
import { TweetStats } from '@components/tweet/tweet-stats';
import { UserAvatar } from '@components/user/user-avatar';
import { UserName } from '@components/user/user-name';
import { UserTooltip } from '@components/user/user-tooltip';
import { UserUsername } from '@components/user/user-username';
import { useAuth } from '@lib/context/auth-context';
import { useModal } from '@lib/hooks/useModal';
import type { Tweet } from '@lib/types/tweet';
import type { User } from '@lib/types/user';
import cn from 'clsx';
import Link from 'next/link';
import { RefObject } from 'react';
import { TweetEmbeds } from '../tweet/tweet-embed';
import { TweetText } from '../tweet/tweet-text';
import { TweetTopic } from '../tweet/tweet-topic';

type ViewTweetProps = Tweet & {
  user: User;
  viewTweetRef?: RefObject<HTMLElement>;
};

export function ViewTweet(tweet: ViewTweetProps): JSX.Element {
  const {
    id: tweetId,
    text,
    images,
    parent,
    userLikes,
    createdBy,
    createdAt,
    userRetweets,
    userReplies,
    viewTweetRef,
    mentions,
    client,
    topic,
    embeds,
    user: tweetUserData
  } = tweet;

  const { id: ownerId, name, username, verified, photoURL } = tweetUserData;

  const { user } = useAuth();

  const { open, openModal, closeModal } = useModal();

  const tweetLink = `/tweet/${tweetId}`;

  const userId = user?.id as string;

  const isOwner = userId === createdBy;

  const reply = !!parent;

  const { id: parentId, username: parentUsername = username } = parent ?? {};

  return (
    <article
      className={cn(
        `accent-tab h- relative flex cursor-default flex-col gap-3 border-b
         border-light-border px-4 py-3 outline-none dark:border-dark-border`,
        reply && 'scroll-m-[3.25rem] pt-0'
      )}
      // {...variants}
      // animate={{ ...variants.animate, transition: { duration: 0.2 } }}
      // exit={undefined}
      ref={viewTweetRef}
    >
      <Modal
        className='flex items-start justify-center'
        modalClassName='bg-main-background rounded-2xl max-w-xl w-full mt-8 overflow-hidden'
        open={open}
        closeModal={closeModal}
      >
        <TweetReplyModal tweet={tweet} closeModal={closeModal} />
      </Modal>
      <div className='flex flex-col gap-2'>
        {reply && (
          <div className='flex w-12 items-center justify-center'>
            <i className='hover-animation h-2 w-0.5 bg-light-line-reply dark:bg-dark-line-reply' />
          </div>
        )}
        <div className='grid grid-cols-[auto,1fr] gap-3'>
          <UserTooltip avatar {...tweetUserData}>
            <UserAvatar src={photoURL} alt={name} username={username} />
          </UserTooltip>
          <div className='flex min-w-0 justify-between'>
            <div className='flex cursor-pointer flex-col truncate xs:overflow-visible xs:whitespace-normal '>
              <UserTooltip {...tweetUserData}>
                <UserName
                  className='-mb-1'
                  name={name}
                  username={username}
                  verified={verified}
                />
              </UserTooltip>
              <UserTooltip {...tweetUserData}>
                <UserUsername username={username} />
              </UserTooltip>
            </div>
            <div className='px-4'>
              <TweetActions
                viewTweet
                isOwner={isOwner}
                ownerId={ownerId}
                tweetId={tweetId}
                parentId={parentId}
                username={username}
                hasImages={!!images}
                createdBy={createdBy}
              />
            </div>
          </div>
        </div>
      </div>
      {reply && (
        <p className='text-light-secondary dark:text-dark-secondary'>
          Replying to{' '}
          <Link href={`/user/${parentUsername}`}>
            <a className='custom-underline text-main-accent'>
              @{parentUsername}
            </a>
          </Link>
        </p>
      )}
      <div>
        <TweetText text={text || ''} images={images} mentions={mentions} />
        {images && (
          <ImagePreview
            viewTweet
            imagesPreview={images}
            previewCount={images.length}
          />
        )}
        {embeds && embeds.length > 0 && <TweetEmbeds embeds={embeds} />}
        {topic && (
          <span className='mt-2 inline-block'>
            <TweetTopic topic={topic} />
          </span>
        )}
        <div
          className='inner:hover-animation inner:border-b inner:border-light-border
                     dark:inner:border-dark-border'
        >
          <div className='flex '>
            <span className='flex items-center gap-1 py-4 text-light-secondary dark:text-dark-secondary'>
              <TweetDate
                viewTweet
                tweetLink={tweetLink}
                createdAt={createdAt}
              />
              {client && (
                <>
                  <i className='px-1  '>·</i>{' '}
                  <span className='inline '>via {client}</span>
                </>
              )}
            </span>
          </div>
          <TweetStats
            viewTweet
            reply={reply}
            userId={userId}
            isOwner={isOwner}
            tweetId={tweetId}
            userLikes={userLikes}
            userRetweets={userRetweets}
            userReplies={userReplies}
            openModal={openModal}
            tweetAuthorId={ownerId}
          />
        </div>
        <Input
          reply
          parent={
            parent
              ? { id: tweetId, username: username, userId: parent.userId! }
              : undefined
          }
        />
      </div>
    </article>
  );
}
