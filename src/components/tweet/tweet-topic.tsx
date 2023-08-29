import Link from 'next/link';
import { TopicType } from '../../lib/types/topic';
import { NextImage } from '../ui/next-image';

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
    <div className='inline flex items-center'>
      #
      {topic.image && (
        <span className='mx-1 inline flex-shrink-0 flex-grow-0 overflow-hidden rounded-md'>
          <NextImage
            src={topic.image}
            alt={topic.name}
            objectFit='contain'
            width={16}
            height={16}
          ></NextImage>
        </span>
      )}
      <div className='inline inline overflow-hidden text-ellipsis'>
        {/* TODO: Fix CSS truncation */}
        {topic.name.length > 30 ? topic.name.slice(0, 30) + '...' : topic.name}
      </div>
    </div>
  );
}
