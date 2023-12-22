import { Input } from '@components/input/input';
import { Modal } from '@components/modal/modal';
import { CustomIcon } from '@components/ui/custom-icon';
import { HeroIcon } from '@components/ui/hero-icon';
import { useAuth } from '@lib/context/auth-context';
import { useWindow } from '@lib/context/window-context';
import { useModal } from '@lib/hooks/useModal';
import Link from 'next/link';
import { SidebarContent } from './sidebar-content';

export function Sidebar(): JSX.Element {
  const { user, userNotifications, resetNotifications } = useAuth();
  const { isMobile } = useWindow();

  const { open, openModal, closeModal } = useModal();

  const username = user?.username as string;

  return (
    <header
      id='sidebar'
      className='flex w-0 shrink-0 justify-center transition-opacity duration-200 xs:w-20 md:w-24
                 lg:max-w-none xl:-mr-4 xl:w-full xl:max-w-xs xl:justify-end'
    >
      <Modal
        className='flex items-start justify-center'
        modalClassName='bg-main-background rounded-2xl max-w-xl w-full mt-8 overflow-hidden'
        open={open}
        closeModal={closeModal}
      >
        <Input isModal closeModal={closeModal} />
      </Modal>
      <div
        className='fixed top-0 flex hidden h-full flex-col justify-between border-t border-light-border 
                   bg-main-background py-0 dark:border-dark-border xs:block md:px-4 xl:w-72'
      >
        <h1 className='p-3'>
          <Link href='/home'>
            <a
              className='custom-button main-tab text-accent-blue transition
                       focus-visible:bg-accent-blue/10 focus-visible:!ring-accent-blue/80
                       dark:text-twitter-icon'
            >
              <CustomIcon className='h-7 w-7' iconName='TwitterIcon' />
            </a>
          </Link>
        </h1>
        <SidebarContent />
        {!user?.keyPair && (
          <Link passHref href='/login'>
            <a
              className='custom-button main-tab accent-tab absolute right-4 -translate-y-[72px] bg-main-accent text-center text-lg font-bold text-white
                       outline-none transition hover:brightness-90 active:brightness-75 xs:static xs:translate-y-0
                       xs:hover:bg-main-accent/90 xs:active:bg-main-accent/75 xl:w-11/12'
            >
              <HeroIcon
                className='block h-6 w-6 xl:hidden'
                iconName='LockClosedIcon'
              />
              <p className='hidden xl:block'>Login</p>
            </a>
          </Link>
        )}
      </div>
    </header>
  );
}
