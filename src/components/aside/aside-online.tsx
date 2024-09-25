import Link from 'next/link';
import { motion } from 'framer-motion';
import { UserCard } from '@components/user/user-card';
import { Loading } from '@components/ui/loading';
import { Error } from '@components/ui/error';
import { variants } from './aside-trends';
import { useAuth } from '../../lib/context/auth-context';
import useSWR from 'swr';
import { fetchJSON } from '../../lib/fetch';
import { OnlineUsersResponse } from '../../lib/types/online';
import { UserCards } from '../user/user-cards';
import { UserAvatar } from '../user/user-avatar';

export function AsideOnline(): JSX.Element {
  const { user, userNotifications } = useAuth();

  const { data: onlineResponse, isValidating: onlineUsersLoading } = useSWR(
    `/api/online?fid=${user?.id}`,
    async (url) => (await fetchJSON<OnlineUsersResponse>(url)).result,
    { revalidateOnFocus: false, refreshInterval: 10_000 }
  );

  return (
    <section className='hover-animation top-[4.5rem] overflow-hidden rounded-2xl bg-main-sidebar-background'>
      {!onlineResponse && onlineUsersLoading && (
        <Loading className='flex h-52 items-center justify-center p-4' />
      )}

      {onlineResponse ? (
        <motion.div className='inner:px-4 inner:py-3' {...variants}>
          <h2 className='text-xl font-bold'>Online</h2>
          <div className='flex gap-2 overflow-scroll px-2'>
            {onlineResponse && onlineResponse.users?.length === 0 && (
              <div>No users online</div>
            )}
            {onlineResponse &&
              onlineResponse.users?.map(({ user, appFid }) => (
                <div key={user.id} className='p-1'>
                  <div className='relative rounded-full bg-gradient-to-r from-blue-500 to-purple-500 p-[2px]'>
                    <div className='relative rounded-full bg-white'>
                      <UserAvatar
                        username={user.username}
                        src={user.photoURL}
                        alt={user.name}
                        size={64}
                      />
                      <div className='absolute bottom-0.5 right-0.5 h-2 w-2 rounded-full bg-green-500'></div>
                      {onlineResponse.appProfilesMap[appFid] && (
                        <img
                          className='border-1 absolute bottom-0.5 h-5 w-5 rounded-md border border-gray-500'
                          src={onlineResponse.appProfilesMap[appFid].pfp}
                          alt={onlineResponse.appProfilesMap[appFid].display}
                        />
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>

          {/* <Link
            href='/online'
            className='custom-button accent-tab hover-card block w-full rounded-2xl
                         rounded-t-none text-center text-main-accent'
          >
            Show more
          </Link> */}
        </motion.div>
      ) : (
        <Error />
      )}
    </section>
  );
}
