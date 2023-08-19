import { useWindow } from '@lib/context/window-context';
import { SearchBar } from './search-bar';
import { AsideFooter } from './aside-footer';
import type { ReactNode } from 'react';
import { User } from '../../lib/types/user';
import { UserAvatar } from '../user/user-avatar';
import { UserName } from '../user/user-name';
import Link from 'next/link';
import { UserUsername } from '../user/user-username';

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
        resultBuilder={(
          { id, username, photoURL, name, verified },
          callback
        ) => {
          return (
            <Link href={`/user/${username}`} passHref={true}>
              <div
                key={id}
                className='flex w-full cursor-pointer p-3 hover:bg-accent-blue/10 focus-visible:bg-accent-blue/20'
                onClick={callback}
              >
                <UserAvatar src={photoURL} alt={name} username={username} />
                <div className='flex flex-col pl-2'>
                  <UserName
                    name={name}
                    username={username}
                    verified={verified}
                    className='text-light-primary dark:text-dark-primary'
                  />
                  <UserUsername username={username} />
                </div>
              </div>
            </Link>
          );
        }}
      />
      {children}
      <AsideFooter />
    </aside>
  );
}
