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
import { isFarcasterUrlEmbed } from '@mod-protocol/farcaster';
import cn from 'clsx';
import type { Variants } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { hasAncestorWithClass } from '../../lib/utils';
import { TweetActions } from './tweet-actions';
import { TweetDate } from './tweet-date';
import { TweetEmbed } from './tweet-embed';
import { ModEmbeds } from './tweet-embeds-mod';
import { TweetStats } from './tweet-stats';
import { TweetText } from './tweet-text';
import { TweetTopicLazy } from './tweet-topic';

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
    topicUrl,
    retweet,
    embeds,
    user: tweetUserData
  } = tweet;

  const { id: ownerId, name, username, verified, photoURL } = tweetUserData;
  const { user } = useAuth();
  const { open, openModal, closeModal } = useModal();
  const tweetLink = `/tweet/${tweetId}`;
  const userId = user?.id as string;
  const isOwner = userId === createdBy;
  const { id: parentId, username: parentUsername = username } = parent ?? {};
  const { push } = useRouter();
  const reply = !!parent;
  const tweetIsRetweeted = retweet !== null;

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
          const clickedElement = event.target as any;
          // Prevent click when clicking on a link or a paragraph or image
          const tagName = (event.target as any).tagName;
          // DIV clicks do not propagate to parent, span used for body text
          const isSpecialElement =
            clickedElement.tagName === 'A' || // For links
            clickedElement.tagName === 'IMG' || // For images
            clickedElement.classList.contains('override-nav') ||
            hasAncestorWithClass(clickedElement, 'override-nav');

          // Prevent click when selecting text
          const text = window.getSelection()?.toString();
          if (text) {
            // event.stopPropagation();
            return;
          }

          if (!isSpecialElement) {
            push(tweetLink);
          }
        }}
      >
        <div className='grid grid-cols-[auto,1fr] gap-x-3 gap-y-1'>
          <div className='flex flex-col items-center gap-2'>
            <UserTooltip avatar modal={modal} {...tweetUserData}>
              <UserAvatar src={photoURL} alt={name} username={username} />
            </UserTooltip>
            {parentTweet && (
              <i className='hover-animation h-full w-0.5 bg-light-line-reply dark:bg-dark-line-reply' />
            )}
          </div>
          <div className='flex min-w-0 flex-col'>
            <div className='flex justify-between gap-2 text-light-secondary dark:text-dark-secondary'>
              <div className='flex gap-1 truncate xs:overflow-visible xs:whitespace-normal'>
                <UserTooltip modal={modal} {...tweetUserData}>
                  <UserName
                    name={name}
                    username={username}
                    verified={verified}
                    className='text-light-primary dark:text-dark-primary'
                  />
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
                    (embed) =>
                      isFarcasterUrlEmbed(embed) && embed.url.startsWith('/')
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

              {topicUrl && <TweetTopicLazy topicUrl={topicUrl} />}
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
                  openModal={openModal}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
