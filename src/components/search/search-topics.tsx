import { useState } from 'react';
import { Button } from '../ui/button';
import { HeroIcon } from '../ui/hero-icon';
import isURL from 'validator/lib/isURL';
import { TopicType } from '../../lib/types/topic';
import { TopicView } from '../tweet/tweet-topic';
import useSWR from 'swr';
import { fetchJSON } from '../../lib/fetch';
import { TrendsResponse } from '../../lib/types/trends';
import { Loading } from '../ui/loading';

export function SearchTopics({
  onSelectRawUrl,
  onSelectTopic,
  setShowing,
  enabled = false
}: {
  onSelectRawUrl: (topicUrl: string) => void;
  onSelectTopic: (topic: TopicType) => void;
  setShowing: (showing: boolean) => void;
  enabled: boolean;
}) {
  const [topicQuery, setTopicQuery] = useState('');

  const { data: allTopics, isValidating: loadingAllTopics } = useSWR(
    enabled ? `/api/trends?limit=50` : null,
    async (url) => {
      const res = await fetchJSON<TrendsResponse>(url);
      return res.result;
    },
    { revalidateOnFocus: false }
  );

  return (
    <div className=''>
      <div>
        <label
          className='group flex items-center justify-between gap-4 rounded-full
                   bg-main-search-background px-4 py-2 transition focus-within:bg-main-background
                   focus-within:ring-2 focus-within:ring-main-accent'
        >
          <i>
            <HeroIcon
              className='h-5 w-5 text-light-secondary transition-colors 
                       group-focus-within:text-main-accent dark:text-dark-secondary'
              iconName='MagnifyingGlassIcon'
            />
          </i>
          {/* TODO: Fix overflow on mobile */}
          <input
            className='peer flex-1 bg-transparent outline-none 
                    placeholder:text-light-secondary dark:placeholder:text-dark-secondary'
            placeholder='Search topics or paste a link'
            value={topicQuery}
            type='text'
            onChange={(e) => setTopicQuery(e.target.value)}
          />
          <Button
            className='accent-tab scale-100 bg-main-accent p-1 transition hover:brightness-90 focus:scale-100 focus:opacity-100 disabled:opacity-0 peer-focus:scale-100 peer-focus:opacity-100'
            onClick={() => {
              setShowing(false);
              setTopicQuery('');
            }}
          >
            <HeroIcon className='h-3 w-3 stroke-white' iconName='XMarkIcon' />
          </Button>
        </label>
      </div>

      <div>
        {loadingAllTopics && <Loading></Loading>}
        {isURL(topicQuery) && (
          <div
            onClick={() => {
              onSelectRawUrl(topicQuery);
              setTopicQuery('');
              setShowing(false);
            }}
            className='mt-2 cursor-pointer rounded-lg p-2 text-light-secondary hover:bg-main-accent/10 dark:text-dark-secondary'
          >
            Choose "{topicQuery}"
          </div>
        )}
        <div className='mt-2 flex flex-wrap gap-2'>
          {allTopics
            ?.filter(
              ({ topic }) =>
                topic !== null &&
                (topicQuery.length === 0 ||
                  topic?.name
                    .toLowerCase()
                    .includes(topicQuery.toLowerCase()) ||
                  topic?.url.toLowerCase().includes(topicQuery.toLowerCase()))
            )
            .slice(0, 5)
            .map(({ topic }, i) => (
              <div
                onClick={() => {
                  onSelectTopic(topic as TopicType);
                  setTopicQuery('');
                  setShowing(false);
                }}
                key={i}
                className='cursor-pointer rounded-lg p-2 text-light-secondary hover:bg-main-accent/10 dark:text-dark-secondary'
              >
                <TopicView topic={topic!} key={i} />
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
