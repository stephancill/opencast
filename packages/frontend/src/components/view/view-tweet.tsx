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
import { TweetText } from '../tweet/tweet-text';
import { TweetTopic } from '../tweet/tweet-topic';
import { ModEmbeds } from '../tweet/tweet-embeds-mod';
import { isFarcasterUrlEmbed } from '@mod-protocol/farcaster';
import { TweetEmbed } from '../tweet/tweet-embed';

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
                topic={topic || undefined}
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
      {/* TODO: Refactor these embeds and those in <Tweet> into common component */}
      <div className='space-y-2'>
        <TweetText text={text || ''} images={images} mentions={mentions} />
        {/* Images are shown using native image preview component */}
        {images && (
          <ImagePreview
            tweet
            imagesPreview={images}
            previewCount={images.length}
          />
        )}
        {/* All embeds that do not route locally are handled by Mod */}
        {embeds && embeds.length > 0 && (
          <ModEmbeds
            embeds={embeds.filter(
              (embed) =>
                !embed.metadata?.mimeType?.startsWith('image/') &&
                !(isFarcasterUrlEmbed(embed) && embed.url.startsWith('/'))
            )}
          />
        )}
        {/* Local routing embeds embeds i.e. /tweet/... */}
        {embeds &&
          embeds.length > 0 &&
          embeds
            .filter(
              (embed) => isFarcasterUrlEmbed(embed) && embed.url.startsWith('/')
            )
            .map((embed, index) => (
              <TweetEmbed
                url={(embed as { url: string }).url}
                image={embed.metadata?.image?.url}
                icon={embed.metadata?.logo?.url}
                title={embed.metadata?.title}
                text={embed.metadata?.description}
                key={index}
              />
            ))}
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
            <span className='flex flex-wrap items-center gap-1 py-4 text-light-secondary dark:text-dark-secondary'>
              <TweetDate
                viewTweet
                tweetLink={tweetLink}
                createdAt={createdAt}
              />
              {client && (
                <>
                  <i className='px-1  '>·</i>{' '}
                  <span className='inline'>via {client}</span>
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
        {user?.keyPair && (
          <Input
            isReply
            parentPost={{ id: tweetId, username: username, userId: ownerId }}
            parentUrl={topic?.url || undefined}
          />
        )}
      </div>
    </article>
  );
}
