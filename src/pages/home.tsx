import { SEO } from '@components/common/seo';
import { MainContainer } from '@components/home/main-container';
import { MainHeader } from '@components/home/main-header';
import { Input } from '@components/input/input';
import { HomeLayout, ProtectedLayout } from '@components/layout/common-layout';
import { MainLayout } from '@components/layout/main-layout';
import {
  fallbackFrameContext,
  OnComposeFormActionFuncReturnType
} from '@frames.js/render';
import { useFrame } from '@frames.js/render/use-frame';
import { useWindow } from '@lib/context/window-context';
import cn from 'clsx';
import { useEffect, useState, type ReactElement, type ReactNode } from 'react';
import useSWR from 'swr';
import { TweetFeed } from '../components/feed/tweet-feed';
import { ComposerFormActionDialog } from '../components/modal/composer-action';
import { Modal } from '../components/modal/modal';
import { FeedOrderingSelector } from '../components/ui/feed-ordering-selector';
import { HeroIcon } from '../components/ui/hero-icon';
import { NextImage } from '../components/ui/next-image';
import { UserAvatar } from '../components/user/user-avatar';
import { AwaitableController } from '../lib/awaitable-controller';
import { useAuth } from '../lib/context/auth-context';
import { useFrameConfig } from '../lib/context/frame-config-context';
import { generateAuthToken } from '../lib/farcaster/utils';
import { useModal } from '../lib/hooks/useModal';
import { FeedOrderingType } from '../lib/types/feed';
import { StoriesResponse } from '../lib/types/stories';

export default function Home(): JSX.Element {
  const { isMobile } = useWindow();
  const { user, userNotifications } = useAuth();
  const { openModal, open, closeModal } = useModal();
  const [composeFormActionDialogSignal, setComposerFormActionDialogSignal] =
    useState<AwaitableController<
      OnComposeFormActionFuncReturnType,
      any
    > | null>(null);
  const { frameConfig } = useFrameConfig();

  const actionFrameState = useFrame({
    homeframeUrl: 'https://stories.steer.fun/frames/actions/post',
    frameContext: fallbackFrameContext,
    ...frameConfig,
    async onComposerFormAction({ form }) {
      try {
        const dialogSignal = new AwaitableController<
          OnComposeFormActionFuncReturnType,
          any
        >(form);

        setComposerFormActionDialogSignal(dialogSignal);

        const result = await dialogSignal;

        return result;
      } catch (e) {
        console.error(e);
      } finally {
        setComposerFormActionDialogSignal(null);
      }
    }
  });

  const { data: storiesResponse, isValidating: storiesLoading } = useSWR(
    `/api/stories?fid=${user?.id}`,
    async (url) => {
      if (!user?.id) return;
      const authToken = await generateAuthToken({}, parseInt(user.id));
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${authToken}`
        },
        method: 'POST'
      });

      const responseJson: StoriesResponse = await response.json();

      return responseJson.result;
    },
    {
      revalidateOnFocus: false,
      refreshInterval: 10_000,
      onError: (error) => {
        console.log('error', error);
      }
    }
  );

  const [feedOrdering, setFeedOrdering] = useState<FeedOrderingType>('latest');

  useEffect(() => {
    if (composeFormActionDialogSignal) {
      openModal();
    }
  }, [composeFormActionDialogSignal]);

  return (
    <MainContainer>
      <SEO
        title={`${
          userNotifications && user?.keyPair ? `(${userNotifications}) ` : ''
        }Home / Opencast`}
      />
      <MainHeader
        useMobileSidebar
        title='Home'
        className='flex items-center justify-between'
      ></MainHeader>
      <Modal
        modalClassName='relative bg-main-background rounded-2xl max-w-xl w-full h-[672px] overflow-hidden'
        open={open}
        closeModal={closeModal}
      >
        {composeFormActionDialogSignal && (
          <ComposerFormActionDialog
            composerActionForm={composeFormActionDialogSignal.data}
            onClose={() => {
              composeFormActionDialogSignal.resolve(undefined);
            }}
            onSave={({ composerState }) => {
              composeFormActionDialogSignal.resolve({
                composerActionState: composerState
              });
            }}
          />
        )}
      </Modal>
      <div className='overflow-scroll'>
        <div className='flex items-center gap-2 px-2'>
          {storiesLoading && !storiesResponse && (
            <div className='p-1'>
              <NextImage
                useSkeleton
                className='overflow-hidden rounded-full'
                imgClassName='rounded-full !h-full !w-full'
                width={64}
                height={64}
                src={''}
                alt={''}
                key={'loading'}
              />
            </div>
          )}

          <div className='flex items-center gap-2 px-2'>
            {user && (
              <button
                onClick={async () => {
                  actionFrameState.onComposerActionButtonPress({
                    castAction: {
                      url: 'https://stories.steer.fun/frames/actions/post'
                    },
                    composerActionState: {
                      text: '',
                      embeds: []
                    },
                    // clear stack, this removes first item that will appear in the debugger
                    clearStack: true
                  });
                }}
              >
                <div className='relative rounded-full bg-gray-500 p-[2px]'>
                  <div className='flex h-[64px] w-[64px] items-center justify-center rounded-full bg-main-background dark:border-dark-border'>
                    <HeroIcon iconName='PlusIcon' className='h-10 w-10' />
                  </div>
                </div>
              </button>
            )}
            {storiesResponse?.stories &&
              storiesResponse?.stories.map(({ user, viewedAll }) => (
                <div key={user.fid} className='p-1'>
                  <div
                    className={cn(
                      'relative rounded-full p-[2px]',
                      viewedAll
                        ? 'bg-gray-500'
                        : 'bg-gradient-to-r from-blue-500 to-purple-500'
                    )}
                  >
                    <div className='relative rounded-full bg-white'>
                      <UserAvatar
                        onClick={() => console.log('on story')}
                        username={user.username}
                        src={user.pfp_url}
                        alt={user.display_name}
                        size={64}
                      />
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
      <FeedOrderingSelector {...{ feedOrdering, setFeedOrdering }} />
      {!isMobile && user?.keyPair && <Input />}
      <TweetFeed
        feedOrdering={feedOrdering}
        apiEndpoint={`/api/feed?fid=${user?.id}`}
      />
    </MainContainer>
  );
}

Home.getLayout = (page: ReactElement): ReactNode => (
  <ProtectedLayout>
    <MainLayout>
      <HomeLayout>{page}</HomeLayout>
    </MainLayout>
  </ProtectedLayout>
);
