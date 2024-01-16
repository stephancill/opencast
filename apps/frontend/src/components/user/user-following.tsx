import { useAuth } from '@lib/context/auth-context';

type UserFollowingProps = {
  userTargetId: string;
};

export function UserFollowing({
  userTargetId
}: UserFollowingProps): JSX.Element | null {
  const { user } = useAuth();

  const isFollowing =
    user?.keyPair &&
    user?.id !== userTargetId &&
    user?.followers.includes(userTargetId);

  if (!isFollowing) return null;

  return (
    <p className='rounded bg-main-search-background px-1 text-xs'>
      Follows you
    </p>
  );
}
