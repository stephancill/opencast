import { useRouter } from 'next/router';
import { TopicType } from '../../lib/types/topic';
import { NextImage } from '../ui/next-image';

export function TweetTopic({ topic }: { topic: TopicType }) {
  const router = useRouter();

  return (
    <span
      onClick={(e) => router.push(`/topic?url=${topic.url}`)}
      className='flex w-full cursor-pointer items-center whitespace-nowrap text-light-secondary hover:underline dark:text-dark-secondary'
    >
      <TopicView topic={topic}></TopicView>
    </span>
  );
}

export function TopicView({ topic }: { topic: TopicType }) {
  return (
    <span className='flex cursor-pointer items-center'>
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
      <span className='inline overflow-hidden text-ellipsis'>
        {/* TODO: Fix CSS truncation */}
        {topic.name.length > 30 ? topic.name.slice(0, 30) + '...' : topic.name}
      </span>
    </span>
  );
}
