import { useAuth } from '../../lib/context/auth-context';
import { useWindow } from '../../lib/context/window-context';
import { useModal } from '../../lib/hooks/useModal';
import { Button } from '../ui/button';
import { CustomIcon } from '../ui/custom-icon';
import { IconName } from '../ui/hero-icon';
import { MoreSettings } from './more-settings';
import { SidebarLink } from './sidebar-link';
import { SidebarProfile } from './sidebar-profile';

export type NavLink = {
  href: string;
  linkName: string;
  iconName: IconName;
  disabled?: boolean;
  canBeHidden?: boolean;
  newTab?: boolean;
};

export const navLinks: Readonly<NavLink[]> = [
  {
    href: '/home',
    linkName: 'Home',
    iconName: 'HomeIcon'
  },
  {
    href: '/trends',
    linkName: 'Topics',
    iconName: 'HashtagIcon'
  }
];

export function SidebarContent() {
  const { user, userNotifications, resetNotifications } = useAuth();
  const { isMobile } = useWindow();

  const { open, openModal, closeModal } = useModal();

  const username = user?.username as string;

  return (
    <div>
      <section className='flex flex-grow flex-col items-stretch justify-center gap-2'>
        <nav className='block flex flex-col justify-around'>
          {navLinks.map(({ ...linkData }) => (
            <SidebarLink {...linkData} key={linkData.href} />
          ))}
          {user?.keyPair && (
            <>
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
                <SidebarLink
                  href='/notifications'
                  iconName='BellIcon'
                  linkName={`Notifications`}
                />
              </div>
              <SidebarLink
                href={`/user/${username}`}
                username={username}
                linkName='Profile'
                iconName='UserIcon'
              />
              <SidebarLink
                href='/settings'
                linkName='Settings'
                iconName='Cog6ToothIcon'
              />
            </>
          )}
          <MoreSettings />
          {user?.keyPair && (
            <Button
              className='accent-tab left-2 ml-2 mt-2 bg-main-accent text-lg font-bold text-white
                       outline-none transition hover:brightness-90 active:brightness-75 xl:w-11/12 '
              onClick={openModal}
            >
              <CustomIcon
                className='block h-6 w-6 xl:hidden'
                iconName='FeatherIcon'
              />
              <p className='hidden xl:block'>Cast</p>
            </Button>
          )}
        </nav>
        {user?.keyPair && (
          <div className='absolute bottom-4 w-full lg:pr-5'>
            <SidebarProfile />
          </div>
        )}
      </section>
    </div>
  );
}
