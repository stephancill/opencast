import { MainHeader } from '@components/home/main-header';
import { MobileSidebarLink } from '@components/sidebar/mobile-sidebar-link';
import { navLinks, type NavLink } from '@components/sidebar/sidebar';
import { Button } from '@components/ui/button';
import { HeroIcon } from '@components/ui/hero-icon';
import { NextImage } from '@components/ui/next-image';
import { UserAvatar } from '@components/user/user-avatar';
import { UserName } from '@components/user/user-name';
import { UserUsername } from '@components/user/user-username';
import { useAuth } from '@lib/context/auth-context';
import { useModal } from '@lib/hooks/useModal';
import type { UserFull } from '@lib/types/user';
import Link from 'next/link';
import { ActionModal } from './action-modal';
import { DisplayModal } from './display-modal';
import { Modal } from './modal';

export type MobileNavLink = Omit<NavLink, 'canBeHidden'>;

const bottomNavLinks: Readonly<MobileNavLink[]> = [];

type Stats = [string, string, number];

type MobileSidebarModalProps = Pick<
  UserFull,
  | 'name'
  | 'username'
  | 'verified'
  | 'photoURL'
  | 'following'
  | 'followers'
  | 'coverPhotoURL'
> & {
  closeModal: () => void;
};

export function MobileSidebarModal({
  name,
  username,
  verified,
  photoURL,
  following,
  followers,
  coverPhotoURL,
  closeModal
}: MobileSidebarModalProps): JSX.Element {
  const { signOut, userNotifications, resetNotifications, user } = useAuth();

  const {
    open: displayOpen,
    openModal: displayOpenModal,
    closeModal: displayCloseModal
  } = useModal();

  const {
    open: logOutOpen,
    openModal: logOutOpenModal,
    closeModal: logOutCloseModal
  } = useModal();

  const allStats: Readonly<Stats[]> = [
    ['following', 'Following', following.length],
    ['followers', 'Followers', followers.length]
  ];

  const userLink = `/user/${username}`;

  return (
    <>
      <Modal
        className='items-center justify-center xs:flex'
        modalClassName='max-w-xl bg-main-background w-full p-8 rounded-2xl hover-animation'
        open={displayOpen}
        closeModal={displayCloseModal}
      >
        <DisplayModal closeModal={displayCloseModal} />
      </Modal>
      <Modal
        modalClassName='max-w-xs bg-main-background w-full p-8 rounded-2xl'
        open={logOutOpen}
        closeModal={logOutCloseModal}
      >
        <ActionModal
          useIcon
          focusOnMainBtn
          title='Log out of Opencast?'
          description='You can always log back in at any time. If you just want to switch accounts, you can do that by adding an existing account.'
          mainBtnLabel='Log out'
          action={signOut}
          closeModal={logOutCloseModal}
        />
      </Modal>
      <MainHeader
        useActionButton
        className='flex flex-row-reverse items-center justify-between'
        iconName='XMarkIcon'
        title='Account info'
        tip='Close'
        action={closeModal}
      />
      <section className='mt-0.5 flex flex-col gap-2 px-4'>
        {user?.keyPair && (
          <>
            <Link
              href={userLink}
              className='blur-picture relative h-20 rounded-md'
            >
              {coverPhotoURL ? (
                <NextImage
                  useSkeleton
                  imgClassName='rounded-md'
                  src={coverPhotoURL}
                  alt={name}
                  layout='fill'
                />
              ) : (
                <div className='h-full rounded-md bg-light-line-reply dark:bg-dark-line-reply' />
              )}
            </Link>
            <div className='-mt-4 mb-8 ml-2'>
              <UserAvatar
                className='absolute -translate-y-1/2 bg-main-background p-1 hover:brightness-100
                       [&:hover>figure>span]:brightness-75
                       [&>figure>span]:[transition:200ms]'
                username={username}
                src={photoURL}
                alt={name}
                size={60}
              />
            </div>
          </>
        )}
        <div className='flex flex-col gap-4 rounded-xl bg-main-sidebar-background p-4'>
          {user?.keyPair && (
            <>
              {' '}
              <div className='flex flex-col'>
                <UserName
                  name={name}
                  username={username}
                  verified={verified}
                  className='-mb-1'
                />
                <UserUsername username={username} />
              </div>
              <div className='text-secondary flex gap-4'>
                {allStats.map(([id, label, stat]) => (
                  <Link
                    href={`${userLink}/${id}`}
                    key={id}
                    className='hover-animation flex h-4 items-center gap-1 border-b border-b-transparent 
                             outline-none hover:border-b-light-primary focus-visible:border-b-light-primary
                             dark:hover:border-b-dark-primary dark:focus-visible:border-b-dark-primary'
                  >
                    <p className='font-bold'>{stat}</p>
                    <p className='text-light-secondary dark:text-dark-secondary'>
                      {label}
                    </p>
                  </Link>
                ))}
                <i className='h-0.5 bg-light-line-reply dark:bg-dark-line-reply' />
              </div>
            </>
          )}

          <nav className='flex flex-col'>
            {user?.keyPair && (
              <>
                <MobileSidebarLink
                  href={`/user/${username}`}
                  iconName='UserIcon'
                  linkName='Profile'
                />
                <div
                  onClick={() => {
                    resetNotifications();
                  }}
                >
                  {userNotifications && (
                    <div className='absolute ml-6 mt-2 flex h-4 min-w-[16px] items-center rounded-full bg-main-accent text-white'>
                      <div className='mx-auto px-1 text-xs'>
                        {userNotifications < 100 ? userNotifications : '99+'}
                      </div>
                    </div>
                  )}
                  <MobileSidebarLink
                    href='https://warpcast.com/~/notifications'
                    iconName='BellIcon'
                    linkName={`Notifications`}
                    newTab
                  />
                </div>
              </>
            )}
            {navLinks.map((linkData) => (
              <MobileSidebarLink {...linkData} key={linkData.href} />
            ))}
          </nav>
          <i className='h-0.5 bg-light-line-reply dark:bg-dark-line-reply' />
          <nav className='flex flex-col'>
            {bottomNavLinks.map((linkData) => (
              <MobileSidebarLink bottom {...linkData} key={linkData.href} />
            ))}
            <Button
              className='accent-tab accent-bg-tab flex items-center gap-2 rounded-md p-1.5 font-bold transition
                         hover:bg-light-primary/10 focus-visible:ring-2 first:focus-visible:ring-[#878a8c] 
                         dark:hover:bg-dark-primary/10 dark:focus-visible:ring-white'
              onClick={displayOpenModal}
            >
              <HeroIcon className='h-5 w-5' iconName='PaintBrushIcon' />
              Display
            </Button>

            {user?.keyPair && (
              <Button
                className='accent-tab accent-bg-tab flex items-center gap-2 rounded-md p-1.5 font-bold transition
                         hover:bg-light-primary/10 focus-visible:ring-2 first:focus-visible:ring-[#878a8c] 
                         dark:hover:bg-dark-primary/10 dark:focus-visible:ring-white'
                onClick={logOutOpenModal}
              >
                <HeroIcon
                  className='h-5 w-5'
                  iconName='ArrowRightOnRectangleIcon'
                />
                Log out
              </Button>
            )}
          </nav>
        </div>
        {!user?.keyPair && (
          <Link
            href='/login'
            className='custom-button main-tab accent-tab right-4 mt-4 bg-main-accent text-center text-lg font-bold text-white
                   outline-none transition hover:brightness-90 active:brightness-75 xl:w-11/12'
          >
            <p>Login</p>
          </Link>
        )}
      </section>
    </>
  );
}
