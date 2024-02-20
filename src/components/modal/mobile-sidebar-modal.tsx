import { MainHeader } from '@components/home/main-header';
import { useAuth } from '@lib/context/auth-context';
import { useModal } from '@lib/hooks/useModal';
import type { UserFull } from '@lib/types/user';
import Link from 'next/link';
import { SidebarContent } from '../sidebar/sidebar-content';
import { CustomIcon } from '../ui/custom-icon';
import { ActionModal } from './action-modal';
import { DisplayModal } from './display-modal';
import { Modal } from './modal';

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
  const { signOut } = useAuth();

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
        tip='Close'
        action={closeModal}
      >
        <h1 className='px-3'>
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
      </MainHeader>
      <section className='mt-0.5 flex flex-col gap-2 px-4'>
        <SidebarContent />
      </section>
    </>
  );
}
