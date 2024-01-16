import { useUser } from '@lib/context/user-context';
import { isPlural } from '@lib/utils';
import type { Variants } from 'framer-motion';
import { useRouter } from 'next/router';
import { formatNumber } from '../../lib/date';
import { UserName } from './user-name';

export const variants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.4 } },
  exit: { opacity: 0, transition: { duration: 0.2 } }
};

export function UserHeader(): JSX.Element {
  const {
    pathname,
    query: { id }
  } = useRouter();

  const { user, loading } = useUser();

  const [totalTweets, totalPhotos] = [
    user?.totalTweets ?? 0,
    user?.totalPhotos
  ];

  const currentPage = pathname.split('/').pop() ?? '';

  const isInTweetPage = ['[id]', 'with_replies'].includes(currentPage);
  const isInFollowPage = ['following', 'followers'].includes(currentPage);

  return (
    // <AnimatePresence mode='popLayout'>
    <div>
      {loading ? (
        <div
          className='-mb-1 inner:animate-pulse inner:rounded-lg 
                     inner:bg-light-secondary dark:inner:bg-dark-secondary'
          {...variants}
          key='loading'
        >
          <div className='-mt-1 mb-1 h-5 w-24' />
          <div className='h-4 w-12' />
        </div>
      ) : !user ? (
        <h2 className='text-xl font-bold' {...variants} key='not-found'>
          {isInFollowPage ? `@${id as string}` : 'User'}
        </h2>
      ) : (
        <div className='-mb-1 truncate' {...variants} key='found'>
          <UserName
            tag='h2'
            name={user.name}
            className='-mt-1 text-xl'
            iconClassName='w-6 h-6'
            verified={user.verified}
          />
          <p className='text-xs text-light-secondary dark:text-dark-secondary'>
            {isInFollowPage
              ? `@${user.username}`
              : isInTweetPage
              ? totalTweets
                ? `${formatNumber(totalTweets)} ${`Cast${isPlural(
                    totalTweets
                  )}`}`
                : 'No Casts'
              : currentPage === 'media'
              ? totalPhotos
                ? `${formatNumber(totalPhotos)} Photo${isPlural(
                    totalPhotos
                  )} & GIF${isPlural(totalPhotos)}`
                : 'No Photo & GIF'
              : ''}
          </p>
        </div>
      )}
      {/* </AnimatePresence> */}
    </div>
  );
}
