import { useRouter } from 'next/router';
import { TopicType } from '../../lib/topics/resolve-topic';
import { NextImage } from '../ui/next-image';

export function TweetTopic({ topic }: { topic: TopicType }) {
  const router = useRouter();

  return (
    <span
      onClick={(e) => router.push(`/topic?url=${topic.url}`)}
      className='flex w-full cursor-pointer items-center whitespace-nowrap pt-3 text-light-secondary hover:underline dark:text-dark-secondary'
    >
      #
      {topic.image && (
        <span className='mx-1 inline flex-shrink-0 flex-grow-0 overflow-hidden rounded-md'>
          <NextImage
            src={topic.image}
            alt={topic.name}
            // layout='fill'
            width={16}
            height={16}
          ></NextImage>
        </span>
      )}
      <span className='inline truncate'>{topic.name}</span>
    </span>
  );
}
