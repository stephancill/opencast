import cn from 'clsx';
import { HeroIcon } from './hero-icon';

export function CautionWarn(): JSX.Element {
  return (
    <div
      className='accent-tab relative 
   flex flex-col gap-0.5 border border-accent-yellow bg-accent-yellow bg-opacity-10 dark:border-dark-border lg:px-6 lg:py-4'
    >
      <div className={cn('flex items-center')}>
        <div className={cn('mr-4 overflow-hidden text-accent-yellow')}>
          <HeroIcon
            className={cn('h-6 w-6')}
            iconName={'ExclamationTriangleIcon'}
          />
        </div>
        <div>
          <p className='font-bold'>Caution</p>
          <p className='text-sm'>
            This feature is still being tested, proceed with caution.
            Functionality and data formats are subject to change.
          </p>
        </div>
      </div>
    </div>
  );
}
