import { useRouter } from 'next/router';
import Link from 'next/link';
import cn from 'clsx';
import { preventBubbling } from '@lib/utils';
import { HeroIcon } from '@components/ui/hero-icon';
import { NavLink } from './sidebar-content';

type SidebarLinkProps = NavLink & {
  username?: string;
};

export function SidebarLink({
  href,
  username,
  iconName,
  linkName,
  disabled,
  canBeHidden,
  newTab
}: SidebarLinkProps): JSX.Element {
  const { asPath } = useRouter();
  const isActive = username
    ? asPath.includes(username)
    : asPath
        .split('/')
        .slice(1, 2)
        .includes(href.split('/')[1] || 'home');

  return (
    <Link href={href}>
      <a
        className={cn(
          'group py-1 outline-none',
          canBeHidden ? 'hidden xs:flex' : 'flex',
          disabled && 'cursor-not-allowed'
        )}
        onClick={disabled ? preventBubbling() : undefined}
        target={newTab ? '_blank' : undefined}
      >
        <div
          className={cn(
            `custom-button flex items-center justify-center gap-4 self-start p-3 text-xl 
             transition duration-200 group-hover:bg-light-primary/10 
             group-focus-visible:ring-2 group-focus-visible:ring-[#878a8c] 
             dark:group-hover:bg-dark-primary/10 dark:group-focus-visible:ring-white`,
            isActive && 'font-bold'
          )}
        >
          <HeroIcon
            className={cn('h-7 w-7')}
            iconName={iconName}
            solid={isActive}
          />
          <p className='block xs:hidden xl:block'>{linkName}</p>
        </div>
      </a>
    </Link>
  );
}
