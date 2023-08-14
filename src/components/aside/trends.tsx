import { Error } from '@components/ui/error';
import { HeroIcon } from '@components/ui/hero-icon';
import { Loading } from '@components/ui/loading';
import { ToolTip } from '@components/ui/tooltip';
import { formatNumber } from '@lib/date';
import cn from 'clsx';
import type { MotionProps } from 'framer-motion';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useQuery } from 'react-query';
import { TrendsResponse } from '../../lib/types/trends';

export const variants: MotionProps = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.8 }
};

type AsideTrendsProps = {
  inTrendsPage?: boolean;
};

export function AsideTrends({ inTrendsPage }: AsideTrendsProps): JSX.Element {
  const fetchTrends = async () => {
    const response = await fetch(`/api/trends?limit=5`);

    if (!response.ok) {
      console.log(await response.json());
      return;
    }

    const responseJson = (await response.json()) as TrendsResponse;

    if (!responseJson.result) {
      console.error(responseJson.message);
    }

    return responseJson.result;
  };

  const { data: trends, isLoading: loading } = useQuery(
    ['trends'],
    fetchTrends
  );

  return (
    <section
      className={cn(
        !inTrendsPage &&
          'hover-animation rounded-2xl bg-main-sidebar-background'
      )}
    >
      {loading ? (
        <Loading />
      ) : trends ? (
        <motion.div
          className={cn('inner:px-4 inner:py-3', inTrendsPage && 'mt-0.5')}
          {...variants}
        >
          {!inTrendsPage && (
            <h2 className='text-xl font-extrabold'>Trending topics</h2>
          )}
          {trends.map(({ topic: topic, volume }) => (
            <Link href={`/topic?url=${topic?.url}`} key={topic?.url}>
              {/* <a
                className='hover-animation accent-tab hover-card relative 
                           flex cursor-not-allowed flex-col gap-0.5'
                onClick={preventBubbling()}
              > */}
              <div
                className='hover-animation accent-tab hover-card relative 
                           flex cursor-pointer flex-col gap-0.5'
              >
                <p className='font-bold'>{topic?.name}</p>
                <p className='text-sm text-light-secondary dark:text-dark-secondary'>
                  {formatNumber(volume)} posts today
                </p>
              </div>
              {/* </a> */}
            </Link>
          ))}
          {/* {!inTrendsPage && (
            <Link href='/trends'>
              <a
                className='custom-button accent-tab hover-card block w-full rounded-2xl
                           rounded-t-none text-center text-main-accent'
              >
                Show more
              </a>
            </Link>
          )} */}
        </motion.div>
      ) : (
        <Error />
      )}
    </section>
  );
}
