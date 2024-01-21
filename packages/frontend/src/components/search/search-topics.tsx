import { useState } from 'react';
import useSWR from 'swr';
import isURL from 'validator/lib/isURL';
import { fetchJSON } from '@lib/fetch';
import { TopicType } from '@lib/types/topic';
import { TrendsResponse } from '@lib/types/trends';
import { SearchBar } from '../input/search-bar';
import { TopicView } from '../tweet/tweet-topic';
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
    <div>
      <SearchBar
        placeholder='Search topics or paste a link'
        inputValue={topicQuery}
        setInputValue={setTopicQuery}
        onChange={(e) => setTopicQuery(e.target.value)}
      />

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
