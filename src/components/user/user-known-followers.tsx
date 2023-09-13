import useSWR from 'swr';
import { useAuth } from '../../lib/context/auth-context';
import { fetchJSON } from '../../lib/fetch';
import { KnownFollowersResponse, User } from '../../lib/types/user';
import { UserAvatar } from './user-avatar';

export function UserKnownFollowersLazy({
  userId,
  enabled: shouldFetch = true
}: {
  enabled?: boolean;
  userId: string;
}) {
  const { user: currentUser } = useAuth();

  const { data: knownFollowersResponse, isValidating: loadingKnownFollowers } =
    useSWR(
      shouldFetch && currentUser
        ? `/api/user/${userId}/known-followers?context_id=${currentUser.id}`
        : null,
      async (url) => (await fetchJSON<KnownFollowersResponse>(url)).result,
      { revalidateOnFocus: false }
    );

  return !knownFollowersResponse ? (
    loadingKnownFollowers ? (
      // <UserKnownFollowersSkeleton />
      <></>
    ) : (
      <></>
    )
  ) : (
    <UserKnownFollowers
      resolvedUsers={knownFollowersResponse.resolvedUsers}
      knownFollowerCount={knownFollowersResponse.knownFollowerCount}
    />
  );
}

export function UserKnownFollowers({
  resolvedUsers,
  knownFollowerCount
}: {
  resolvedUsers: User[];
  knownFollowerCount: number;
}) {
  const otherKnownFollowerCount = knownFollowerCount - resolvedUsers.length;
  return (
    knownFollowerCount > 0 && (
      <div className='flex text-sm text-light-secondary dark:text-dark-secondary'>
        <div className='ml-2 mt-1 flex'>
          {resolvedUsers.slice(0, 3).map((user) => (
            <span className='-ml-2'>
              <UserAvatar
                src={user.photoURL}
                alt={user.name}
                size={18}
                username={user.username}
              />
            </span>
          ))}
        </div>
        <div className='ml-2'>
          <span>Followed by </span>
          {resolvedUsers
            .slice(0, 2)
            .map((user) => user.name)
            .join(', ')}
          <span>
            {otherKnownFollowerCount > 0 &&
              `, and ${otherKnownFollowerCount} other
            ${otherKnownFollowerCount > 1 && 's'} you follow`}
          </span>
        </div>
      </div>
    )
  );
}
