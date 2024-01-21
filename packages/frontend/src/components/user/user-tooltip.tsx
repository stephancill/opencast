import { FollowButton } from '@components/ui/follow-button';
import { useWindow } from '@lib/context/window-context';
import type { User, UserFullResponse } from '@lib/types/user';
import cn from 'clsx';
import Link from 'next/link';
import { useState, type ReactNode } from 'react';
import useSWR from 'swr';
import { useAuth } from '@lib/context/auth-context';
import { formatNumber } from '@lib/date';
import { fetchJSON } from '@lib/fetch';
import { TweetText } from '../tweet/tweet-text';
import { TopicView } from '../tweet/tweet-topic';
import { Loading } from '../ui/loading';
import { UserAvatar } from './user-avatar';
import { UserFid } from './user-fid';
import { UserFollowing } from './user-following';
import { UserKnownFollowersLazy } from './user-known-followers';
import { UserName } from './user-name';
import { UserUsername } from './user-username';

type UserTooltipProps = Pick<
  User,
  'id' | 'bio' | 'name' | 'verified' | 'username' | 'photoURL'
> & {
  modal?: boolean;
  avatar?: boolean;
  children: ReactNode;
};

type Stats = [string, string, number];

export function UserTooltip({
  id,
  bio,
  name,
  modal,
  avatar,
  verified,
  children,
  photoURL,
  username
}: UserTooltipProps): JSX.Element {
  const { isMobile } = useWindow();
  const { user: currentUser } = useAuth();

  const [shouldFetch, setShouldFetch] = useState(false);
  let hoverTimer: NodeJS.Timeout | null = null;

  const handleMouseEnter = () => {
    hoverTimer = setTimeout(() => {
      setShouldFetch(true);
    }, 500);
  };

  const handleMouseLeave = () => {
    hoverTimer && clearTimeout(hoverTimer);
    // setShouldFetch(false); // You can choose to keep it true if you want to keep the data
  };

  const { data: user, isValidating } = useSWR(
    shouldFetch ? `/api/user/${id}` : null,
    async (url) => (await fetchJSON<UserFullResponse>(url)).result,
    { revalidateOnFocus: false }
  );

  const { following, followers, interests } = user || {};

  if (isMobile || modal) return <>{children}</>;

  const userLink = `/user/${username}`;

  const allStats: Readonly<Stats[]> = [
    ['following', 'Following', following?.length || 0],
    ['followers', 'Followers', followers?.length || 0]
  ];

  return (
    <div
      className={cn(
        'group relative cursor-pointer self-start text-light-primary dark:text-dark-primary ',
        avatar ? '[&>div]:translate-y-2' : 'grid [&>div]:translate-y-7'
      )}
    >
      <span
        className='override-nav inline'
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </span>
      <div
        className='menu-container invisible absolute left-1/2 w-72 -translate-x-1/2 rounded-2xl 
                   opacity-0 [transition:visibility_0ms_ease_400ms,opacity_200ms_ease_200ms] group-hover:visible 
                   group-hover:opacity-100 group-hover:delay-500'
      >
        {user ? (
          <div className='flex flex-col gap-3 p-4'>
            <div className='flex flex-col gap-2'>
              <div className='-mx-4 -mt-4'>
                <div className='h-16 rounded-t-2xl bg-light-line-reply dark:bg-dark-line-reply' />
              </div>
              <div className='flex justify-between'>
                <div className='mb-10'>
                  <UserAvatar
                    className='absolute -translate-y-1/2 bg-main-background p-1 
                             hover:brightness-100 [&:hover>figure>span]:brightness-75
                             [&>figure>span]:[transition:200ms]'
                    src={photoURL}
                    alt={name}
                    size={64}
                    username={username}
                  />
                </div>
                <FollowButton userTargetId={id} userTargetUsername={username} />
              </div>
              <div>
                <UserName
                  className='-mb-1 text-lg'
                  name={name}
                  username={username}
                  verified={verified}
                />
                <div className='flex flex-wrap items-center gap-1 text-light-secondary dark:text-dark-secondary'>
                  <UserUsername username={username} />
                  <UserFid userId={id} />
                  <UserFollowing userTargetId={id} />
                </div>
              </div>
            </div>
            {bio && <TweetText text={bio} mentions={[]} images={[]} />}
            {interests && (
              <div className='flex flex-wrap'>
                {interests.map((topic) => (
                  <Link href={`/topic?url=${topic.url}`} key={topic.url}>
                    <span className='pr-2 text-light-secondary hover:underline dark:text-dark-secondary'>
                      <TopicView topic={topic} />
                    </span>
                  </Link>
                ))}
              </div>
            )}
            <div className='flex gap-4 text-secondary'>
              {allStats.map(([id, label, stat]) => (
                <Link href={`${userLink}/${id}`} key={id}>
                  <a
                    className='hover-animation flex h-4 items-center gap-1 border-b border-b-transparent 
                             outline-none hover:border-b-light-primary focus-visible:border-b-light-primary
                             dark:hover:border-b-dark-primary dark:focus-visible:border-b-dark-primary'
                  >
                    <p className='font-bold text-light-primary dark:text-dark-primary'>
                      {formatNumber(stat)}
                    </p>
                    <p className='text-light-secondary dark:text-dark-secondary'>
                      {label}
                    </p>
                  </a>
                </Link>
              ))}
            </div>
            {currentUser?.keyPair && currentUser?.id !== id && (
              <UserKnownFollowersLazy userId={id} enabled={shouldFetch} />
            )}
          </div>
        ) : isValidating ? (
          <Loading className='p-4' />
        ) : (
          <div>Could not load user</div>
        )}
      </div>
    </div>
  );
}
