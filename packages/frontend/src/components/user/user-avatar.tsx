import Link from 'next/link';
import cn from 'clsx';
import { NextImage } from '@components/ui/next-image';

type UserAvatarProps = {
  src: string;
  alt: string;
  size?: number;
  username?: string;
  className?: string;
};

export function UserAvatar({
  src,
  alt,
  size,
  username,
  className
}: UserAvatarProps): JSX.Element {
  const pictureSize = size ?? 48;

  return (
    <Link href={username ? `/user/${username}` : '#'}>
      <span
        className={cn(
          'blur-picture override-nav flex self-start',
          !username && 'pointer-events-none',
          className
        )}
        tabIndex={username ? 0 : -1}
      >
        <NextImage
          useSkeleton
          imgClassName='rounded-full'
          width={pictureSize}
          height={pictureSize}
          src={src}
          alt={alt}
          key={src}
        />
      </span>
    </Link>
  );
}
