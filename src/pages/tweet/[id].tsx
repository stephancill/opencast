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
import type { ReactElement, ReactNode } from 'react';
import { useRef } from 'react';
import { useQuery } from 'react-query';
import { TweetResponse } from '../../lib/types/tweet';

export default function TweetId(): JSX.Element {
  const {
    query: { id },
    back
  } = useRouter();

  const fetchCast = async ({ pageParam = null }) => {
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
  } = useQuery('tweet', fetchCast);

  const viewTweetRef = useRef<HTMLElement>(null);

  // const { data: repliesData, loading: repliesLoading } = useCollection(
  //   query(
  //     tweetsCollection,
  //     where('parent.id', '==', id),
  //     orderBy('createdAt', 'desc')
  //   ),
  //   { includeUser: true, allowNull: true }
  // );

  const { text, images } = tweetData ?? {};

  const imagesLength = images?.length ?? 0;
  const parentId = tweetData?.parent?.id;

  const pageTitle = tweetData
    ? `${tweetData.user?.name} on Twitter: "${text ?? ''}${
        images ? ` (${imagesLength} image${isPlural(imagesLength)})` : ''
      }" / Twitter`
    : null;

  return (
    <MainContainer className='!pb-[1280px]'>
      <MainHeader
        useActionButton
        title={parentId ? 'Thread' : 'Tweet'}
        action={back}
      />
      <section>
        {tweetLoading ? (
          <Loading className='mt-5' />
        ) : !tweetData ? (
          <>
            <SEO title='Tweet not found / Twitter' />
            <Error message='Tweet not found' />
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
            <ViewTweet viewTweetRef={viewTweetRef} {...tweetData} />
            {/* {tweetData &&
              (repliesLoading ? (
                <Loading className='mt-5' />
              ) : (
                <AnimatePresence mode='popLayout'>
                  {repliesData?.map((tweet) => (
                    <Tweet {...tweet} key={tweet.id} />
                  ))}
                </AnimatePresence>
              ))} */}
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
