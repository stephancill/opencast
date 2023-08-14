import { SEO } from '@components/common/seo';
import { UserCards } from '@components/user/user-cards';
import { useUser } from '@lib/context/user-context';
import type { User } from '@lib/types/user';
import { useInfiniteScrollUsers } from '../../lib/hooks/useInfiniteScrollUsers';

type UserFollowProps = {
  type: 'following' | 'followers';
};

export function UserFollow({ type }: UserFollowProps): JSX.Element {
  const { user } = useUser();
  const { name, username, id: userId } = user as User;

  const { data, loading, LoadMore } = useInfiniteScrollUsers(
    (pageParam) => {
      return `/api/user/${userId}/links?type=${type}&limit=10${
        pageParam ? `&cursor=${pageParam}` : ''
      }`;
    },
    {
      queryKey: [userId, type]
    }
  );

  return (
    <>
      <SEO
        title={`People ${
          type === 'following' ? 'followed by' : 'following'
        } ${name} (@${username}) / Twitter`}
      />
      <UserCards
        follow
        data={
          (data?.pages
            .map((page) => page?.users)
            .flat()
            .filter((user) => user !== undefined) as User[]) ?? []
        }
        type={type}
        loading={loading}
        LoadMore={LoadMore}
      />
    </>
  );
}
