import Link from 'next/link';
import useSWR from 'swr';
import { fetchJSON } from '../../lib/fetch';
import { TopicResponse, TopicType } from '../../lib/types/topic';
import { NextImage } from '../ui/next-image';

export function TweetTopicLazy({ topicUrl }: { topicUrl: string }) {
  const { data, isValidating } = useSWR(
    `/api/topic?url=${encodeURIComponent(topicUrl)}`,
    async (url) => (await fetchJSON<TopicResponse>(url)).result
  );

  return !data ? (
    isValidating ? (
      <div className='flex animate-pulse items-center text-light-secondary dark:text-dark-secondary'>
        #{' '}
        <span className='ml-2 mr-1 h-4 w-10 flex-shrink-0 flex-grow-0 rounded-md bg-light-secondary dark:bg-dark-secondary'></span>
      </div>
    ) : (
      <></>
    )
  ) : (
    <TweetTopic topic={data} />
  );
}

export function TweetTopic({ topic }: { topic: TopicType }) {
  return (
    <Link href={`/topic?url=${encodeURIComponent(topic.url)}`} passHref>
      <a className='flex w-full cursor-pointer items-center whitespace-nowrap text-light-secondary hover:underline dark:text-dark-secondary'>
        <TopicView topic={topic}></TopicView>
      </a>
    </Link>
  );
}

export function TopicView({ topic }: { topic: TopicType }) {
  return (
    <div className='override-nav inline flex items-center'>
      #
      {topic.image && (
        <span className='override-nav mx-1 inline flex-shrink-0 flex-grow-0 overflow-hidden rounded-md'>
          <NextImage
            src={topic.image}
            alt={topic.name}
            objectFit='contain'
            width={16}
            height={16}
          ></NextImage>
        </span>
      )}
      <div className='override-nav inline inline overflow-hidden text-ellipsis'>
        {/* TODO: Fix CSS truncation */}
        {topic.name.length > 30 ? topic.name.slice(0, 30) + '...' : topic.name}
      </div>
    </div>
  );
}
