import { useAuth } from '@lib/context/auth-context';

type UserFollowingProps = {
  userId: string;
};

export function UserFid({
  userId: userTargetId
}: UserFollowingProps): JSX.Element | null {
  return (
    <p
      className='rounded bg-main-search-background px-1 text-xs'
      title={`FID ${userTargetId}`}
    >
      # {parseInt(userTargetId).toLocaleString()}
    </p>
  );
}
