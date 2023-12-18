import Link from 'next/link';
import { HeroIcon, IconName } from './hero-icon';
import cn from 'clsx';

export type MenuLinkProps = {
  href: string;
  description: string;
  title: string;
  iconName: IconName;
};

export function MenuRow({ href, description, title, iconName }: MenuLinkProps) {
  return (
    <Link href={href}>
      <div
        className='hover-animation accent-tab hover-card relative 
               flex cursor-pointer flex-col gap-0.5 px-6 py-4'
      >
        <div className=' flex items-center'>
          <div className='mr-4 overflow-hidden'>
            <HeroIcon className={cn('h-6 w-6')} iconName={iconName} />
          </div>
          <div>
            {/* <p className='font-bold'>Manage Signers</p>
            <p className='text-sm text-light-secondary dark:text-dark-secondary'>
              Manage the keypairs that have access to your account
            </p> */}
            <p className='font-bold'>{title}</p>
            <p className='text-sm text-light-secondary dark:text-dark-secondary'>
              {description}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
