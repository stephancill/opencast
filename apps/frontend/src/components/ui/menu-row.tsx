import Link from 'next/link';
import { HeroIcon, IconName } from './hero-icon';
import cn from 'clsx';
import { Loading } from './loading';

type MenuLinkPropsBase = {
  description: string;
  title: string;
  iconName: IconName;
  variant?: 'destructive' | 'primary';
  isLoading?: boolean;
};

type MenuLinkPropsLink = MenuLinkPropsBase & {
  href: string;
  onClick?: never;
};

type MenuLinkPropsButton = MenuLinkPropsBase & {
  href?: never;
  onClick: (...args: unknown[]) => unknown;
};

export type MenuLinkProps = MenuLinkPropsLink | MenuLinkPropsButton;

function MenuRowBase({
  description,
  title,
  iconName,
  variant,
  isLoading
}: MenuLinkPropsBase) {
  return (
    <div
      className='hover-animation accent-tab hover-card relative 
               flex cursor-pointer flex-col gap-0.5 border-b border-light-border dark:border-dark-border lg:px-6 lg:py-4'
    >
      <div
        className={cn(
          'flex items-center',
          variant === 'destructive' ? 'text-accent-red' : undefined
        )}
      >
        <div
          className={cn(
            'mr-4 overflow-hidden',
            variant === 'primary' ? 'text-accent-green' : undefined
          )}
        >
          <HeroIcon className={cn('h-6 w-6')} iconName={iconName} />
        </div>
        <div>
          <p className='font-bold'>{title}</p>
          <p className='text-sm text-light-secondary dark:text-dark-secondary'>
            {description}
          </p>
        </div>
        {isLoading && (
          <div className='ml-auto'>
            <Loading />
          </div>
        )}
      </div>
    </div>
  );
}

export function MenuRow(props: MenuLinkProps) {
  const { href, onClick, isLoading, ...rest } = props;

  return href ? (
    <Link href={href} passHref>
      <a>
        <MenuRowBase {...rest} />
      </a>
    </Link>
  ) : (
    <div onClick={() => !isLoading && onClick?.()}>
      <MenuRowBase {...rest} isLoading={isLoading} />
    </div>
  );
}
