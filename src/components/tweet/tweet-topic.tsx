import { useRouter } from 'next/router';
import { TopicType } from '../../lib/topics/resolve-topic';
import { NextImage } from '../ui/next-image';

export function TweetTopic({ topic }: { topic: TopicType }) {
  const router = useRouter();

  return (
    <span className='flex'>
      <span
        onClick={(e) => router.push(`/topic?url=${topic.url}`)}
        className='flex shrink cursor-pointer items-center whitespace-nowrap pt-3 text-light-secondary hover:underline dark:text-dark-secondary'
      >
        #
        {topic.image && (
          <span className='mx-1 overflow-hidden rounded-md'>
            <NextImage
              src={topic.image}
              alt={topic.name}
              // layout='fill'
              width={16}
              height={16}
            ></NextImage>
          </span>
        )}
        {topic.name}
      </span>
    </span>
  );
}
