import { SEO } from '@components/common/seo';
import { MainContainer } from '@components/home/main-container';
import { MainHeader } from '@components/home/main-header';
import { HomeLayout, ProtectedLayout } from '@components/layout/common-layout';
import { MainLayout } from '@components/layout/main-layout';
import { Error } from '@components/ui/error';
import { Loading } from '@components/ui/loading';
import { ViewParentTweet } from '@components/view/view-parent-tweet';
import { ViewTweet } from '@components/view/view-tweet';
import { isPlural } from '@lib/utils';
import { useRouter } from 'next/router';
import {
  ReactElement,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { useQuery } from 'react-query';
import { Tweet } from '../../components/tweet/tweet';
import { useInfiniteScroll } from '../../lib/hooks/useInfiniteScroll';
import {
  populateTweetTopic,
  populateTweetUsers,
  TweetResponse
} from '../../lib/types/tweet';

export default function TweetId(): JSX.Element {
  const {
    query: { id },
    back
  } = useRouter();

  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    setEnabled(true);
  }, []);

  const fetchCast = async () => {
    const response = await fetch(`/api/tweet/${id}`);

    if (!response.ok) {
      console.log(await response.json());
      return;
    }

    const responseJson = (await response.json()) as TweetResponse;

    if (!responseJson.result) {
      console.error(responseJson.message);
    }

    const tweet = responseJson.result;

    return tweet;
  };

  const {
    data: tweetData,
    isLoading: tweetLoading,
    isError: tweetError
  } = useQuery(['tweet', id], fetchCast, {
    keepPreviousData: false,
    refetchOnWindowFocus: false
  });

  const {
    data: repliesData,
    loading: repliesLoading,
    LoadMore
  } = useInfiniteScroll(
    (pageParam) =>
      `/api/tweet/${id}/replies?limit=10${
        pageParam ? `&cursor=${pageParam}` : ''
      }`,
    { queryKey: ['replies', id], enabled, refetchOnFocus: false }
  );

  const viewTweetRef = useRef<HTMLElement>(null);

  const { text, images } = tweetData ?? {};

  const imagesLength = images?.length ?? 0;
  const parentId = tweetData?.parent?.id;

  const pageTitle = tweetData
    ? `${tweetData.users[tweetData.createdBy]?.name} on Opencast: "${
        text ?? ''
      }${
        images ? ` (${imagesLength} image${isPlural(imagesLength)})` : ''
      }" / Opencast`
    : null;

  const resolvedMentions = useMemo(() => {
    const resolvedMentions =
      tweetData?.mentions.map((mention) => ({
        ...mention,
        username: tweetData?.users[mention.userId]?.username
      })) || [];
    return resolvedMentions;
  }, [tweetData]);

  return (
    <MainContainer className='!pb-[1280px]'>
      <MainHeader
        useActionButton
        title={parentId ? 'Thread' : 'Cast'}
        action={back}
      />
      <section>
        {tweetLoading ? (
          <Loading className='mt-5' />
        ) : !tweetData ? (
          <>
            <SEO title='Cast not found / Opencast' />
            <Error message='Cast not found' />
          </>
        ) : (
          <>
            {pageTitle && <SEO title={pageTitle} />}
            {parentId && (
              <ViewParentTweet
                parentId={parentId}
                viewTweetRef={viewTweetRef}
              />
            )}
            <ViewTweet
              viewTweetRef={viewTweetRef}
              {...tweetData}
              mentions={resolvedMentions}
              user={tweetData.users[tweetData.createdBy]}
            />
            {tweetData &&
              (repliesLoading ? (
                <Loading className='mt-5' />
              ) : !repliesData ? (
                <div>No replies</div>
              ) : (
                <div>
                  {repliesData.pages.map((page) => {
                    if (!page) return;
                    const { tweets, users, topics } = page;
                    return tweets.map((tweet) => {
                      if (!users[tweet.createdBy]) {
                        return <></>;
                      }

                      return (
                        <Tweet
                          {...populateTweetTopic(
                            populateTweetUsers(tweet, users),
                            topics
                          )}
                          user={users[tweet.createdBy]}
                          key={tweet.id}
                        />
                      );
                    });
                  })}
                  <LoadMore />
                </div>
              ))}
          </>
        )}
      </section>
    </MainContainer>
  );
}

TweetId.getLayout = (page: ReactElement): ReactNode => (
  <ProtectedLayout>
    <MainLayout>
      <HomeLayout>{page}</HomeLayout>
    </MainLayout>
  </ProtectedLayout>
);
