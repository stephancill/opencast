import { ActionModal } from '@components/modal/action-modal';
import { Modal } from '@components/modal/modal';
import { Button } from '@components/ui/button';
import { HeroIcon } from '@components/ui/hero-icon';
import { ToolTip } from '@components/ui/tooltip';
import { CastAddBody, Message } from '@farcaster/hub-web';
import { Dialog, Popover } from '@headlessui/react';
import { useAuth } from '@lib/context/auth-context';
import { useModal } from '@lib/hooks/useModal';
import type { Tweet } from '@lib/types/tweet';
import type { User } from '@lib/types/user';
import { preventBubbling } from '@lib/utils';
import cn from 'clsx';
import type { Variants } from 'framer-motion';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import useSWR from 'swr';
import {
  createCastMessage,
  createRemoveCastMessage,
  submitHubMessage
} from '../../lib/farcaster/utils';
import { fetchJSON } from '../../lib/fetch';
import { BaseResponse } from '../../lib/types/responses';
import { TopicResponse, TopicType } from '../../lib/types/topic';
import { SearchTopics } from '../search/search-topics';
import { Loading } from '../ui/loading';
import { TopicView } from './tweet-topic';

export const variants: Variants = {
  initial: { opacity: 0, y: -25 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', duration: 0.4 }
  },
  exit: { opacity: 0, y: -25, transition: { duration: 0.2 } }
};

type TweetActionsProps = Pick<Tweet, 'createdBy'> & {
  isOwner: boolean;
  ownerId: string;
  tweetId: string;
  username: string;
  parentId?: string;
  hasImages: boolean;
  viewTweet?: boolean;
  topic?: TopicType;
};

export function TweetActions({
  isOwner,
  tweetId,
  username,
  createdBy,
  topic
}: TweetActionsProps): JSX.Element {
  const { user: currentUser, isAdmin } = useAuth();

  const {
    open: removeOpen,
    openModal: removeOpenModal,
    closeModal: removeCloseModal
  } = useModal();

  const {
    open: repostOpen,
    openModal: repostOpenModal,
    closeModal: repostCloseModal
  } = useModal();

  const [repostTopicUrl, setRepostTopicUrl] = useState<string>();
  const [showingTopicSelector, setShowingTopicSelector] = useState(false);
  const [repostTopic, setRepostTopic] = useState<TopicType | null>(
    topic || null
  );
  const [repostModalLoading, setRepostModalLoading] = useState(false);

  const { data: topicResult, isValidating: loadingTopic } = useSWR(
    repostTopicUrl
      ? `/api/topic?url=${encodeURIComponent(repostTopicUrl)}`
      : null,
    async (url) => {
      const res = await fetchJSON<TopicResponse>(url);
      return res.result;
    },
    { revalidateOnFocus: false }
  );

  const { id: userId } = currentUser as User;
  const isInAdminControl = isAdmin && !isOwner;

  const handleRemove = async (): Promise<void> => {
    const message = await createRemoveCastMessage({
      castHash: tweetId,
      castAuthorFid: parseInt(userId)
    });

    if (message) {
      toast.success(
        `${isInAdminControl ? `@${username}'s` : 'Your'} Cast was deleted`
      );

      removeCloseModal();
    } else {
      toast.error(`Failed to delete cast`);
    }
  };

  const handleRepostInChannel = async (): Promise<void> => {
    // Set loading
    setRepostModalLoading(true);
    // Get original message
    const messageJson = (
      await fetchJSON<BaseResponse<any>>(
        `/api/hub?hash=${tweetId}&fid=${createdBy}`
      )
    ).result;
    const message = Message.fromJSON(messageJson);
    if (!message) {
      toast.error('Failed to get original message');
      setRepostModalLoading(false);
      return;
    }
    const castAddBody = CastAddBody.fromJSON(message.data?.castAddBody);
    if (!castAddBody) {
      toast.error('Failed to get original message');
      setRepostModalLoading(false);
      return;
    }

    // Replace topic with new topic
    const newCastAddBody = await createCastMessage({
      text: castAddBody.text,
      embeds: castAddBody.embeds,
      parentCastHash: castAddBody.parentCastId?.hash
        ? Buffer.from(castAddBody.parentCastId?.hash).toString('hex')
        : undefined,
      parentCastFid: castAddBody.parentCastId?.fid,
      parentUrl: repostTopic?.url,
      mentions: castAddBody.mentions,
      mentionsPositions: castAddBody.mentionsPositions,
      fid: parseInt(createdBy)
    });
    if (!newCastAddBody) {
      toast.error('Failed to create new message');
      setRepostModalLoading(false);
      return;
    }

    // Submit new message
    const res = await submitHubMessage(newCastAddBody);
    if (!res) {
      toast.error('Failed to repost message');
      setRepostModalLoading(false);
      return;
    }

    const newMessage = Message.fromJSON(res);
    const newCastId = Buffer.from(newMessage.hash).toString('hex');

    setRepostModalLoading(false);
    repostCloseModal();

    toast.success(
      () => (
        <span className='flex gap-2'>
          Your cast was reposted
          <Link href={`/tweet/${newCastId}`}>
            <a className='custom-underline font-bold'>View</a>
          </Link>
        </span>
      ),
      { duration: 6000 }
    );
  };

  const handleOpenInWarpcast = (closeMenu: () => void) => {
    closeMenu();
    window.open(
      `https://warpcast.com/${username}/0x${tweetId.slice(0, 5)}`,
      '_blank'
    );
  };

  useEffect(() => {
    if (repostTopicUrl === repostTopic?.url || repostTopic === undefined)
      return;
    setRepostTopicUrl(repostTopic?.url);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repostTopic]);

  useEffect(() => {
    if (topicResult && repostTopic?.url !== topicResult.url) {
      setRepostTopic(topicResult);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicResult]);

  return (
    <>
      <Modal
        modalClassName='max-w-xs bg-main-background w-full p-8 rounded-2xl'
        open={removeOpen}
        closeModal={removeCloseModal}
      >
        <ActionModal
          title='Delete Cast?'
          description={`This can’t be undone and it will be removed from ${
            isInAdminControl ? `@${username}'s` : 'your'
          } profile, the timeline of any accounts that follow ${
            isInAdminControl ? `@${username}` : 'you'
          }, and from Farcaster search results.`}
          mainBtnClassName='bg-accent-red hover:bg-accent-red/90 active:bg-accent-red/75 accent-tab
                            focus-visible:bg-accent-red/90'
          mainBtnLabel='Delete'
          focusOnMainBtn
          action={handleRemove}
          closeModal={removeCloseModal}
        />
      </Modal>
      <Modal
        modalClassName='max-w-sm bg-main-background w-full p-8 rounded-2xl'
        open={repostOpen}
        closeModal={repostCloseModal}
      >
        <div className='flex flex-col gap-6'>
          <div className='flex flex-col gap-4'>
            <div className='flex flex-col gap-2'>
              <div className='flex items-center'>
                <i className='inline pr-2'>
                  <HeroIcon iconName='ArrowPathRoundedSquareIcon' />
                </i>
                <Dialog.Title className='inline text-xl font-bold'>
                  Repost to topic
                </Dialog.Title>
              </div>
              <Dialog.Description className='text-light-secondary dark:text-dark-secondary'>
                Repost this Cast to another topic
              </Dialog.Description>
            </div>
          </div>
          {loadingTopic ? (
            <div className='w-10'>
              <Loading />
            </div>
          ) : showingTopicSelector ? (
            <SearchTopics
              enabled={repostOpen}
              onSelectRawUrl={(url) => setRepostTopicUrl(url)}
              onSelectTopic={(topic) => setRepostTopic(topic)}
              setShowing={setShowingTopicSelector}
            />
          ) : (
            repostTopic && (
              <div
                className='cursor-pointer text-light-secondary dark:text-dark-secondary'
                onClick={() => setShowingTopicSelector(true)}
              >
                <span className='inline'>
                  <TopicView topic={repostTopic} />
                </span>
              </div>
            )
          )}
          {repostModalLoading ? (
            <Loading className='w-full' />
          ) : (
            <Button
              className='accent-tab flex items-center justify-center bg-main-accent font-bold text-white enabled:hover:bg-main-accent/90 enabled:active:bg-main-accent/75'
              onClick={() => {
                handleRepostInChannel();
              }}
              disabled={repostModalLoading}
            >
              Repost
            </Button>
          )}
        </div>
      </Modal>
      <Popover>
        {({ open, close }): JSX.Element => (
          <>
            <Popover.Button
              as={Button}
              className={cn(
                `main-tab group group absolute right-2 top-2 p-2 
                 hover:bg-accent-blue/10 focus-visible:bg-accent-blue/10
                 focus-visible:!ring-accent-blue/80 active:bg-accent-blue/20`,
                open && 'bg-accent-blue/10 [&>div>svg]:text-accent-blue'
              )}
            >
              <div className='group relative'>
                <HeroIcon
                  className='h-5 w-5 text-light-secondary group-hover:text-accent-blue
                             group-focus-visible:text-accent-blue dark:text-dark-secondary/80'
                  iconName='EllipsisHorizontalIcon'
                />
                {!open && <ToolTip tip='More' />}
              </div>
            </Popover.Button>
            <AnimatePresence>
              {open && (
                <Popover.Panel
                  className='menu-container group absolute right-2 top-[50px] whitespace-nowrap text-light-primary 
                             dark:text-dark-primary'
                  as={motion.div}
                  {...variants}
                  static
                >
                  {(isAdmin || isOwner) && (
                    <Popover.Button
                      className='accent-tab flex w-full gap-3 rounded-md rounded-b-none p-4 text-accent-red
                                 hover:bg-main-sidebar-background'
                      as={Button}
                      onClick={preventBubbling(removeOpenModal)}
                    >
                      <HeroIcon iconName='TrashIcon' />
                      Delete
                    </Popover.Button>
                  )}

                  {/* {userIsFollowed ? (
                    <Popover.Button
                      className='accent-tab flex w-full gap-3 rounded-md rounded-t-none p-4 hover:bg-main-sidebar-background'
                      as={Button}
                      onClick={preventBubbling(handleFollow(close, 'unfollow'))}
                    >
                      <HeroIcon iconName='UserMinusIcon' />
                      Unfollow @{username}
                    </Popover.Button>
                  ) : (
                    <Popover.Button
                      className='accent-tab flex w-full gap-3 rounded-md rounded-t-none p-4 hover:bg-main-sidebar-background'
                      as={Button}
                      onClick={preventBubbling(handleFollow(close, 'follow'))}
                    >
                      <HeroIcon iconName='UserPlusIcon' />
                      Follow @{username}
                    </Popover.Button>
                  )} */}
                  {isOwner && (
                    <Popover.Button
                      className='accent-tab flex w-full gap-3 rounded-md rounded-t-none p-4 hover:bg-main-sidebar-background'
                      as={Button}
                      onClick={preventBubbling(async (): Promise<void> => {
                        close();
                        setShowingTopicSelector(true);
                        repostOpenModal();
                      })}
                    >
                      <HeroIcon iconName='ArrowPathRoundedSquareIcon' />
                      Repost to topic
                    </Popover.Button>
                  )}
                  <Popover.Button
                    className='accent-tab flex w-full gap-3 rounded-md rounded-t-none p-4 hover:bg-main-sidebar-background'
                    as={Button}
                    onClick={preventBubbling(() => handleOpenInWarpcast(close))}
                  >
                    <HeroIcon iconName='ArrowTopRightOnSquareIcon' />
                    Open in Warpcast
                  </Popover.Button>
                </Popover.Panel>
              )}
            </AnimatePresence>
          </>
        )}
      </Popover>
    </>
  );
}
