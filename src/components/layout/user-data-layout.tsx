import { SEO } from '@components/common/seo';
import { MainContainer } from '@components/home/main-container';
import { MainHeader } from '@components/home/main-header';
import { UserHeader } from '@components/user/user-header';
import { UserContextProvider } from '@lib/context/user-context';
import { useRouter } from 'next/router';
import useSWR from 'swr';
import { fetchJSON } from '../../lib/fetch';
import { UserResponse } from '../../lib/types/user';
import type { LayoutProps } from './common-layout';

export function UserDataLayout({ children }: LayoutProps): JSX.Element {
  const {
    query: { id },
    back
  } = useRouter();

  const { data: user, isValidating: loading } = useSWR(
    id ? `/api/user/${id}` : null,
    async (url) => (await fetchJSON<UserResponse>(url)).result,
    { revalidateOnFocus: false, revalidateOnReconnect: false }
  );

  return (
    <UserContextProvider
      value={{ user: user || null, loading: !user && loading }}
    >
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
