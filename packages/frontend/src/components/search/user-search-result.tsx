import { User } from '@lib/types/user';
import { NextImage } from '../ui/next-image';

export function UserSearchResult({
  user,
  callback
}: {
  user: User;
  callback?: () => void;
}) {
  const { id, username, photoURL, name } = user;
  return (
    <div
      key={id}
      className='flex w-full cursor-pointer p-3 hover:bg-accent-blue/10 focus-visible:bg-accent-blue/20'
      onClick={callback}
    >
      <NextImage
        useSkeleton
        imgClassName='rounded-full'
        width={48}
        height={48}
        src={photoURL}
        alt={username}
        key={photoURL}
      />
      <div className='flex flex-col pl-2'>
        <span className='text-light-primary dark:text-dark-primary'>
          {name}
        </span>
        <span className='truncate text-light-secondary dark:text-dark-secondary'>
          @{username}
        </span>
      </div>
    </div>
  );
}
