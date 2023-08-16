import cn from 'clsx';
import { Button } from '@components/ui/button';
import { HeroIcon } from '@components/ui/hero-icon';
import { ToolTip } from '@components/ui/tooltip';
import { MobileSidebar } from '@components/sidebar/mobile-sidebar';
import type { ReactNode } from 'react';
import type { IconName } from '@components/ui/hero-icon';
import { NextImage } from '../ui/next-image';

type HomeHeaderProps = {
  tip?: string;
  title?: string;
  description?: string;
  children?: ReactNode;
  imageUrl?: string;
  iconName?: IconName;
  className?: string;
  disableSticky?: boolean;
  useActionButton?: boolean;
  useMobileSidebar?: boolean;
  action?: () => void;
};

export function MainHeader({
  tip,
  title,
  description,
  children,
  imageUrl,
  iconName,
  className,
  disableSticky,
  useActionButton,
  useMobileSidebar,
  action
}: HomeHeaderProps): JSX.Element {
  return (
    <header
      className={cn(
        'hover-animation even z-10 bg-main-background/60 px-4 py-2 backdrop-blur-md',
        !disableSticky && 'sticky top-0',
        className ?? 'flex items-center gap-6'
      )}
    >
      {useActionButton && (
        <Button
          className='dark-bg-tab group relative p-2 hover:bg-light-primary/10 active:bg-light-primary/20 
                     dark:hover:bg-dark-primary/10 dark:active:bg-dark-primary/20'
          onClick={action}
        >
          <HeroIcon
            className='h-5 w-5'
            iconName={iconName ?? 'ArrowLeftIcon'}
          />
          <ToolTip tip={tip ?? 'Back'} />
        </Button>
      )}
      {title && (
        <div className='flex items-center'>
          {imageUrl && (
            <span className='mr-2 inline flex-shrink-0 flex-grow-0 overflow-hidden rounded-md'>
              <NextImage
                src={imageUrl}
                alt={title || 'image'}
                objectFit='contain'
                width={48}
                height={48}
              ></NextImage>
            </span>
          )}
          <div className='flex flex-col'>
            {useMobileSidebar && <MobileSidebar />}
            <h2 className='text-xl font-bold' key={title}>
              {title}
            </h2>

            {description && (
              <p
                className='text-light-secondary dark:text-dark-secondary'
                key={description}
              >
                {description}
              </p>
            )}
          </div>
        </div>
      )}

      {children}
    </header>
  );
}
