import { SEO } from '@components/common/seo';
import { FollowButton } from '@components/ui/follow-button';
import { Loading } from '@components/ui/loading';
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
import type { LayoutProps } from './common-layout';

export function UserHomeLayout({ children }: LayoutProps): JSX.Element {
  const { user, isAdmin } = useAuth();
  const { user: userData, loading } = useUser();

  const {
    query: { id }
  } = useRouter();

  const profileData = userData
    ? { src: userData.photoURL, alt: userData.name }
    : null;

  const { id: userId } = user ?? {};

  const isOwner = userData?.id === userId;

  return (
    <>
      {userData && (
        <SEO title={`${`${userData.name} (@${userData.username})`} / Selekt`} />
      )}
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
          <UserNav userId={userData.username} />
          {children}
        </>
      )}
    </>
  );
}
