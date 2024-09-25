import Link from 'next/link';
import cn from 'clsx';
import { NextImage } from '@components/ui/next-image';

type UserAvatarProps = {
  src: string;
  alt: string;
  size?: number;
  username?: string;
  className?: string;
  onClick?: () => void;
};

export function UserAvatar({
  src,
  alt,
  size,
  username,
  className,
  onClick
}: UserAvatarProps): JSX.Element {
  const pictureSize = size ?? 48;

  return (
    <Link
      href={username ? `/user/${username}` : '#'}
      onClick={(e) => {
        if (onClick) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div
        className={cn(
          'blur-picture override-nav border border-gray-200 dark:border-gray-800',
          !username && 'pointer-events-none',
          className
        )}
        tabIndex={username ? 0 : -1}
      >
        <NextImage
          useSkeleton
          className='overflow-hidden rounded-full'
          imgClassName='rounded-full !h-full !w-full'
          width={pictureSize}
          height={pictureSize}
          src={src}
          alt={alt}
          key={src}
        />
      </div>
    </Link>
  );
}
