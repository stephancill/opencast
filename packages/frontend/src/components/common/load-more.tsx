import { useEffect, useRef } from 'react';

// TODO: Replace other load more components with this one
export function LoadMoreSentinel({
  loadMore,
  isLoading
}: {
  loadMore: () => void;
  isLoading: boolean;
}) {
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !isLoading) {
          loadMore();
        }
      },
      {
        root: null,
        rootMargin: '0px',
        threshold: 1.0
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        observer.unobserve(ref.current);
      }
    };
  }, [loadMore, isLoading]);

  return <div ref={ref}></div>;
}
