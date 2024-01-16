import { useWindow } from '@lib/context/window-context';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { User } from '../../lib/types/user';
import { UserSearchResult } from '../search/user-search-result';
import { AsideFooter } from './aside-footer';
import { SearchBar } from './search-bar';

type AsideProps = {
  children: ReactNode;
};

export function Aside({ children }: AsideProps): JSX.Element | null {
  const { width } = useWindow();

  if (width < 1024) return null;

  return (
    <aside className='flex w-96 flex-col gap-4 px-4 py-3 pt-1'>
      <SearchBar<User>
        urlBuilder={(input) =>
          input.length > 0 ? `/api/search?q=${input}` : null
        }
        resultBuilder={(user, callback) => {
          return (
            <Link href={`/user/${user.username}`} passHref>
              <a>
                <UserSearchResult
                  user={user}
                  key={user.id}
                  callback={callback}
                />
              </a>
            </Link>
          );
        }}
      />
      {children}
      <AsideFooter />
    </aside>
  );
}
