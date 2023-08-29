import { SEO } from '@components/common/seo';
import { Button } from '@components/ui/button';
import { FollowButton } from '@components/ui/follow-button';
import { HeroIcon } from '@components/ui/hero-icon';
import { Loading } from '@components/ui/loading';
import { ToolTip } from '@components/ui/tooltip';
import { UserDetails } from '@components/user/user-details';
import { UserEditProfile } from '@components/user/user-edit-profile';
import { variants } from '@components/user/user-header';
import { UserHomeAvatar } from '@components/user/user-home-avatar';
import { UserNav } from '@components/user/user-nav';
import { UserShare } from '@components/user/user-share';
import { useAuth } from '@lib/context/auth-context';
import { useUser } from '@lib/context/user-context';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { TipModal } from '../modal/tip-modal';
import type { LayoutProps } from './common-layout';

export function UserHomeLayout({ children }: LayoutProps): JSX.Element {
  const { user, isAdmin } = useAuth();
  const { user: userData, loading } = useUser();

  const {
    query: { id }
  } = useRouter();

  const [isTipModalOpen, setIsTipModalOpen] = useState(false);

  const profileData = userData
    ? { src: userData.photoURL, alt: userData.name }
    : null;

  const { id: userId } = user ?? {};

  const isOwner = userData?.id === userId;

  return (
    <>
      {userData && (
        <SEO
          title={`${`${userData.name} (@${userData.username})`} / Opencast`}
        />
      )}
      <TipModal
        isUserLoading={loading}
        tipCloseModal={() => setIsTipModalOpen(false)}
        tipUserOpen={isTipModalOpen}
        user={userData || undefined}
        username={userData?.username || '...'}
      />
      <motion.section {...variants} exit={undefined}>
        {loading ? (
          <Loading className='mt-5' />
        ) : !userData ? (
          <>
            {/* <UserHomeCover /> */}
            <div className='flex flex-col gap-8'>
              <div className='relative flex flex-col gap-3 px-4 py-3'>
                <UserHomeAvatar />
                <p className='text-xl font-bold'>@{id}</p>
              </div>
              <div className='p-8 text-center'>
                <p className='text-3xl font-bold'>This account doesn’t exist</p>
                <p className='text-light-secondary dark:text-dark-secondary'>
                  Try searching for another.
                </p>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* <UserHomeCover coverData={coverData} /> */}
            <div className='relative flex flex-col gap-3 px-4 py-3'>
              <div className='flex justify-between'>
                <UserHomeAvatar profileData={profileData} />
                {isOwner ? (
                  <UserEditProfile />
                ) : (
                  <div className='flex gap-2 self-start'>
                    <UserShare username={userData.username} />
                    <Button
                      className='dark-bg-tab group relative border border-light-line-reply p-2
                                 hover:bg-light-primary/10 active:bg-light-primary/20 dark:border-light-secondary 
                                 dark:hover:bg-dark-primary/10 dark:active:bg-dark-primary/20'
                      onClick={() => setIsTipModalOpen(true)}
                    >
                      <HeroIcon className='h-5 w-5' iconName='BanknotesIcon' />
                      <ToolTip tip='Tip' />
                    </Button>
                    <FollowButton
                      userTargetId={userData.id}
                      userTargetUsername={userData.username}
                    />
                    {isAdmin && <UserEditProfile hide />}
                  </div>
                )}
              </div>
              <UserDetails {...userData} />
            </div>
          </>
        )}
      </motion.section>
      {userData && (
        <>
          <UserNav />
          {children}
        </>
      )}
    </>
  );
}
