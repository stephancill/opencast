import { useAuth } from '@lib/context/auth-context';
import { FeedOrderingType } from '@lib/types/feed';
import { SegmentedNavLink } from './segmented-nav-link';

interface FeedOrderingSelectorProps {
  feedOrdering: FeedOrderingType;
  setFeedOrdering: (ordering: FeedOrderingType) => void;
}

export function FeedOrderingSelector({
  feedOrdering,
  setFeedOrdering
}: FeedOrderingSelectorProps) {
  const { setTimelineCursor } = useAuth();

  return (
    <div
      className='hover-animation flex justify-between overflow-y-auto
    border-b border-light-border dark:border-dark-border'
    >
      {[
        { name: 'Latest', value: 'latest' },
        { name: 'Top', value: 'top' }
      ].map((item) => (
        <SegmentedNavLink
          name={item.name}
          key={item.value}
          isActive={feedOrdering === item.value}
          onClick={() => {
            setFeedOrdering(item.value as FeedOrderingType);
            setTimelineCursor(new Date());
          }}
        />
      ))}
    </div>
  );
}
