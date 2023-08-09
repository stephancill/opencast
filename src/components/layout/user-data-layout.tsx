import { useRouter } from 'next/router';
import { query, where, limit } from 'firebase/firestore';
import { UserContextProvider } from '@lib/context/user-context';
import { useCollection } from '@lib/hooks/useCollection';
import { usersCollection } from '@lib/firebase/collections';
import { SEO } from '@components/common/seo';
import { MainContainer } from '@components/home/main-container';
import { MainHeader } from '@components/home/main-header';
import { UserHeader } from '@components/user/user-header';
import type { LayoutProps } from './common-layout';
import { useQuery } from 'react-query';
import { UserResponse } from '../../lib/types/user';

export function UserDataLayout({ children }: LayoutProps): JSX.Element {
  const {
    query: { id },
    back
  } = useRouter();

  const fetchUser = async () => {
    const response = await fetch(`/api/user/${id}`);

    if (!response.ok) {
      console.log(await response.json());
      return;
    }

    const responseJson = (await response.json()) as UserResponse;

    if (!responseJson.result) {
      console.error(responseJson.message);
    }

    return responseJson.result;
  };

  const { data: user, isLoading: loading } = useQuery(['user', id], fetchUser);

  return (
    <UserContextProvider value={{ user: user || null, loading }}>
      {!user && !loading && <SEO title='User not found / Twitter' />}
      <MainContainer>
        <MainHeader useActionButton action={back}>
          <UserHeader />
        </MainHeader>
        {children}
      </MainContainer>
    </UserContextProvider>
  );
}
