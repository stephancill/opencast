import { useEffect, useState } from 'react';
import useSWR from 'swr';

export function SyncView({ userId }: { userId?: string }) {
  const [syncing, setSyncing] = useState(true);

  const { data } = useSWR(
    userId && syncing ? `/api/user/${userId}/sync` : undefined,
    async (url) => {
      const res = await fetch(url);
      return res.json();
    },
    {
      refreshInterval: 1000
    }
  );

  useEffect(() => {
    if (data && data.done) {
      setSyncing(false);
    }
  }, [data]);

  return (
    <div>
      {data && !data.done && (
        <div className='flex flex-col gap-2'>
          <div>Indexing...</div>
          <div className='flex flex-col'>
            <div title='Indexing' className='rounded-full border'>
              <div
                style={{
                  width: `${Math.round(
                    (data.completedCount / data.childCount) * 100
                  )}%`
                }}
                className={`flex min-w-[20%] items-center rounded-full bg-light-primary px-2 text-right dark:bg-dark-primary`}
              >
                <div className='ml-auto text-white dark:text-black'>
                  {Math.round((data.completedCount / data.childCount) * 100)}%
                </div>
              </div>
            </div>
            <div className='text-light-secondary dark:text-dark-secondary'>
              {data.status}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
