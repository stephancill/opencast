import { Error } from '@components/ui/error';
import { Loading } from '@components/ui/loading';
import { formatNumber } from '@lib/date';
import cn from 'clsx';
import type { MotionProps } from 'framer-motion';
import { motion } from 'framer-motion';
import Link from 'next/link';
import useSWR from 'swr';
import { fetchJSON } from '../../lib/fetch';
import { TrendsResponse } from '../../lib/types/trends';
import { NextImage } from '../ui/next-image';

export const variants: MotionProps = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.8 }
};

type AsideTrendsProps = {
  inTrendsPage?: boolean;
};

export function AsideTrends({ inTrendsPage }: AsideTrendsProps): JSX.Element {
  const { data: trends, isValidating: loading } = useSWR(
    `/api/trends?limit=${inTrendsPage ? 20 : 5}`,
    async (url: string) => (await fetchJSON<TrendsResponse>(url)).result,
    {
      revalidateOnFocus: false
    }
  );

  return (
    <section
      className={cn(
        !inTrendsPage &&
        'hover-animation sticky top-[4.5rem] overflow-hidden rounded-2xl bg-main-sidebar-background'
      )}
    >
      {loading ? (
        <Loading />
      ) : trends ? (
        <motion.div
          className={cn('flex flex-col gap-4', inTrendsPage && 'mt-0.5')}
          {...variants}
        >
          {!inTrendsPage && (

            <h2 className='px-4 pt-4 text-xl font-extrabold'>Trending topics</h2>
          )}
          <div className='flex flex-col'>
            <div className='flex flex-col'>
              {trends.map(({ topic: topic, volume }) => (
                <Link href={`/topic?url=${topic?.url}`} key={topic?.url}>
                  <div
                    className='hover-animation accent-tab hover-card relative 
                           flex cursor-pointer flex-col gap-0.5 py-2 px-4'
                  >
                    <div className='flex items-center'>
                      {topic?.image && (
                        <div className='mr-2 overflow-hidden rounded-md border'>
                          <NextImage
                            imgClassName='object-fill'
                            src={topic.image}
                            alt={topic.name}
                            // layout='fill'
                            width={36}
                            height={36}
                          ></NextImage>
                        </div>
                      )}
                      <div>
                        <p className='font-bold'>{topic?.name}</p>
                        <p className='text-sm text-light-secondary dark:text-dark-secondary'>
                          {formatNumber(volume)} posts today
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            {!inTrendsPage && (
              <Link
                href='/trends'
                className='custom-button accent-tab hover-card block w-full rounded-2xl
                           rounded-t-none text-center text-main-accent'
              >
                Show more
              </Link>
            )}
          </div>
        </motion.div>
      ) : (
        <Error />
      )}
    </section>
  );
}
