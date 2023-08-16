import { useAuth } from '@lib/context/auth-context';

type UserFollowingProps = {
  // userTargetId: string;
  isUserFollowing: boolean;
};

export function UserFollowing(): JSX.Element | null {
  return (
    <p className='rounded bg-main-search-background px-1 text-xs'>
      Follows you
    </p>
  );
}
