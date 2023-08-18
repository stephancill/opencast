import { useEffect, useState } from 'react';
import { Tweet } from './tweet';
import { TweetParent } from './tweet-parent';
import type { Tweet as TweetType, TweetWithUsers } from '@lib/types/tweet';

type TweetWithParentProps = {
  data: TweetType[];
};

export type LoadedParents = Record<'parentId' | 'childId', string>[];

export function TweetWithParent({ data }: TweetWithParentProps): JSX.Element {
  const [loadedParents, setLoadedParents] = useState<LoadedParents>([]);

  const addParentId = (parentId: string, targetChildId: string): void =>
    setLoadedParents((prevLoadedParents) =>
      prevLoadedParents.some((item) => item.parentId === parentId)
        ? prevLoadedParents
        : [...prevLoadedParents, { parentId, childId: targetChildId }]
    );

  const filteredData = data.filter(
    (child) => !loadedParents.some((parent) => parent.parentId === child.id)
  );

  useEffect(() => {
    console.log(filteredData);
  }, [filteredData]);

  return (
    <>
      {filteredData.map((tweet) => (
        <div className='[&>article:nth-child(2)]:-mt-1' key={tweet.id}>
          {tweet.parent && (
            <TweetParent
              parentId={tweet.parent.id}
              loadedParents={loadedParents}
              addParentId={addParentId}
            />
          )}
          {tweet.user && <Tweet {...tweet} user={tweet.user} />}
        </div>
      ))}
    </>
  );
}
