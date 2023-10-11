import { SEO } from '@components/common/seo';
import { MainContainer } from '@components/home/main-container';
import { MainHeader } from '@components/home/main-header';
import { HomeLayout, ProtectedLayout } from '@components/layout/common-layout';
import { MainLayout } from '@components/layout/main-layout';
import { Error } from '@components/ui/error';
import { Loading } from '@components/ui/loading';
import { MessageType, ReactionType } from '@farcaster/hub-web';
import Link from 'next/link';
import { useEffect, useState, type ReactElement, type ReactNode } from 'react';
import useSWRInfinite from 'swr/infinite';
import { LoadMoreSentinel } from '../components/common/load-more';
import { Tweet as TweetView } from '../components/tweet/tweet';
import { splitAndInsert } from '../components/tweet/tweet-text';
import { HeroIcon } from '../components/ui/hero-icon';
import { UserAvatar } from '../components/user/user-avatar';
import { UserName } from '../components/user/user-name';
import { UserTooltip } from '../components/user/user-tooltip';
import { useAuth } from '../lib/context/auth-context';
import {
  AccumulatedFollow,
  AccumulatedReaction,
  BasicMention,
  BasicNotification,
  BasicReply,
  NotificationsResponseFull
} from '../lib/types/notifications';
import { populateTweetUsers } from '../lib/types/tweet';
import { isPlural } from '../lib/utils';

export default function NotificationsPage(): JSX.Element {
  const { user, resetNotifications } = useAuth();

  const [lastCheckedNotifications, setLastCheckedNotifications] = useState(
    new Date()
  );

  const {
    data: pages,
    size,
    setSize,
    isValidating: loading,
    error
  } = useSWRInfinite<NotificationsResponseFull>(
    (pageIndex, prevPage) => {
      if (!user) return null;

      if (prevPage && !prevPage.result?.cursor) return null;

      const baseUrl = `/api/user/${
        user.id
      }/notifications?before_time=${lastCheckedNotifications.toISOString()}&full=true`;

      if (pageIndex === 0) return baseUrl;

      if (!prevPage?.result) return null;

      return `${baseUrl}&cursor=${prevPage.result.cursor}&limit=10`;
    },
    { revalidateFirstPage: false }
  );

  const hasMore = !!pages?.[size - 1]?.result?.notifications.length;

  useEffect(() => {
    resetNotifications();
    console.log(lastCheckedNotifications.toISOString());
  }, []);

  return (
    <MainContainer>
      <SEO title={`Notifications / Opencast`} />
      <MainHeader
        useMobileSidebar
        title='Recent Notifications'
        className='flex items-center justify-between'
      ></MainHeader>
      <section className='mt-0.5 xs:mt-0'>
        {error ? (
          <Error message='Something went wrong' />
        ) : (
          pages && (
            <div>
              {pages.map(
                ({ result: data }, pageIndex) =>
                  data &&
                  data.notifications && (
                    <div className='flex flex-col'>
                      {data.notifications.map((item, index) => {
                        switch (item.messageType) {
                          case MessageType.REACTION_ADD:
                            const reaction = item as AccumulatedReaction;
                            const cast = populateTweetUsers(
                              data.tweetsMap[reaction.castId],
                              data.usersMap
                            );
                            return (
                              <div
                                key={index}
                                className='accent-tab sm:hover-card flex border-b border-light-border px-3 py-2 dark:border-dark-border'
                              >
                                <HeroIcon
                                  className='ml-4 mr-6 mt-3 h-6 w-6 flex-shrink-0 flex-grow-0'
                                  iconName={
                                    reaction.reactionType === ReactionType.LIKE
                                      ? 'HeartIcon'
                                      : 'ArrowPathRoundedSquareIcon'
                                  }
                                />
                                <div className='flex flex-col'>
                                  <div className='flex gap-1 py-2'>
                                    {reaction.reactions
                                      .slice(0, 8)
                                      .map((reaction) => (
                                        <UserTooltip
                                          key={reaction.userId}
                                          {...data.usersMap[reaction.userId]}
                                        >
                                          {data.usersMap[reaction.userId] && (
                                            <UserAvatar
                                              src={
                                                data.usersMap[reaction.userId]
                                                  .photoURL
                                              }
                                              alt={
                                                data.usersMap[reaction.userId]
                                                  .name
                                              }
                                              username={
                                                data.usersMap[reaction.userId]
                                                  .username
                                              }
                                              className='h-8 w-8'
                                            />
                                          )}
                                        </UserTooltip>
                                      ))}
                                  </div>
                                  <div>
                                    <span className='inline-block hover:underline'>
                                      {data.usersMap[reaction.userId] && (
                                        <UserTooltip
                                          key={reaction.userId}
                                          {...data.usersMap[reaction.userId]}
                                        >
                                          <UserName
                                            name={
                                              data.usersMap[reaction.userId]
                                                .name
                                            }
                                            verified={false}
                                          />
                                        </UserTooltip>
                                      )}
                                    </span>
                                    {}{' '}
                                    {reaction.reactions.length > 1
                                      ? `and ${
                                          reaction.reactions.length
                                        } other${
                                          isPlural(reaction.reactions.length)
                                            ? 's'
                                            : ''
                                        }`
                                      : ''}{' '}
                                    {reaction.reactionType === ReactionType.LIKE
                                      ? 'liked'
                                      : 'recasted'}{' '}
                                    your post
                                  </div>
                                  <Link href={`/tweet/${cast.id}`} passHref>
                                    <a className='w-full cursor-pointer break-words text-gray-500 [overflow-wrap:anywhere] hover:brightness-75 dark:hover:brightness-125'>
                                      {splitAndInsert(
                                        cast.text || '',
                                        cast.mentions.map(
                                          (mention) => mention.position
                                        ),
                                        cast.mentions.map((mention, index) => (
                                          <>@{mention.username || ''}</>
                                        )),
                                        (s) => (
                                          <>{s}</>
                                        )
                                      )}
                                    </a>
                                  </Link>
                                </div>
                              </div>
                            );
                          case MessageType.LINK_ADD:
                            const link = item as AccumulatedFollow;
                            const user = data.usersMap[link.userId];
                            return (
                              <div
                                key={index}
                                className='accent-tab sm:hover-card flex border-b border-light-border px-3 py-2 dark:border-dark-border'
                              >
                                <HeroIcon
                                  className='ml-4 mr-6 mt-3 h-6 w-6 flex-shrink-0 flex-grow-0'
                                  iconName={'UserPlusIcon'}
                                />
                                <div className='flex flex-col'>
                                  <div className='flex gap-1 py-2'>
                                    {link.follows.slice(0, 8).map((follow) => (
                                      <UserTooltip
                                        key={follow.userId}
                                        {...data.usersMap[follow.userId]}
                                      >
                                        {data.usersMap[follow.userId] && (
                                          <UserAvatar
                                            src={
                                              data.usersMap[follow.userId]
                                                .photoURL
                                            }
                                            alt={
                                              data.usersMap[follow.userId].name
                                            }
                                            username={
                                              data.usersMap[follow.userId]
                                                .username
                                            }
                                            className='h-8 w-8'
                                          />
                                        )}
                                      </UserTooltip>
                                    ))}
                                  </div>

                                  <div>
                                    <span className='inline-block hover:underline'>
                                      {data.usersMap[item.userId] && (
                                        <UserTooltip
                                          key={item.userId}
                                          {...data.usersMap[item.userId]}
                                        >
                                          <UserName
                                            name={
                                              data.usersMap[item.userId].name
                                            }
                                            verified={false}
                                          />
                                        </UserTooltip>
                                      )}
                                    </span>{' '}
                                    {link.follows.length > 0
                                      ? ` and ${link.follows.length} other${
                                          isPlural(link.follows.length)
                                            ? 's'
                                            : ''
                                        }`
                                      : ''}{' '}
                                    followed you
                                  </div>
                                </div>
                              </div>
                            );
                          case MessageType.CAST_ADD:
                            // Reply or mention
                            if ((item as BasicReply).parentUserId) {
                              const reply = item as BasicReply;
                              return (
                                <div key={index}>
                                  <TweetView
                                    {...populateTweetUsers(
                                      data.tweetsMap[reply.castId],
                                      data.usersMap
                                    )}
                                    user={data.usersMap[reply.userId]}
                                  />
                                </div>
                              );
                            } else {
                              // Mention
                              const mention = item as BasicMention;
                              return (
                                <div key={index}>
                                  <TweetView
                                    {...populateTweetUsers(
                                      data.tweetsMap[mention.castId],
                                      data.usersMap
                                    )}
                                    user={data.usersMap[mention.userId]}
                                  />
                                </div>
                              );
                            }
                        }
                      })}
                    </div>
                  )
              )}
              {hasMore && (
                <LoadMoreSentinel
                  loadMore={() => {
                    setSize(size + 1);
                  }}
                  isLoading={loading}
                ></LoadMoreSentinel>
              )}
            </div>
          )
        )}
      </section>
      {loading && <Loading className='mt-5' />}
    </MainContainer>
  );
}

NotificationsPage.getLayout = (page: ReactElement): ReactNode => (
  <ProtectedLayout>
    <MainLayout>
      <HomeLayout>{page}</HomeLayout>
    </MainLayout>
  </ProtectedLayout>
);
