import { formatDate } from '@lib/date';
import { HeroIcon } from '@components/ui/hero-icon';
import { ToolTip } from '@components/ui/tooltip';
import { UserName } from './user-name';
import { UserFollowing } from './user-following';
import { UserFollowStats } from './user-follow-stats';
import type { IconName } from '@components/ui/hero-icon';
import type { User, UserFull } from '@lib/types/user';
import Link from 'next/link';
import { TopicView } from '../tweet/tweet-topic';
import { TweetText } from '../tweet/tweet-text';
import { UserFid } from './user-fid';

type UserDetailsProps = Pick<
  UserFull,
  | 'id'
  | 'bio'
  | 'name'
  | 'website'
  | 'username'
  | 'location'
  | 'verified'
  | 'createdAt'
  | 'following'
  | 'followers'
  | 'interests'
>;

type DetailIcon = [string | null, IconName];

export function UserDetails({
  id,
  bio,
  name,
  website,
  username,
  location,
  verified,
  createdAt,
  following,
  followers,
  interests
}: UserDetailsProps): JSX.Element {
  const detailIcons: Readonly<DetailIcon[]> = [
    [location, 'MapPinIcon'],
    [website, 'LinkIcon']
    // [`Joined ${formatDate(new Date(createdAt), 'joined')}`, 'CalendarDaysIcon']
  ];

  return (
    <>
      <div>
        <UserName
          className='-mb-1 text-xl'
          name={name}
          iconClassName='w-6 h-6'
          verified={verified}
        />
        <div className='flex items-center gap-1 text-light-secondary dark:text-dark-secondary'>
          <p>@{username}</p>
          <UserFid userId={id} />
          <UserFollowing userTargetId={id} />
        </div>
      </div>
      <div className='flex flex-col gap-2'>
        {/* {bio && <p className='whitespace-pre-line break-words'>{bio}</p>} */}
        {bio && <TweetText text={bio} images={[]} mentions={[]} />}
        <div className='flex flex-wrap gap-x-3 gap-y-1 text-light-secondary dark:text-dark-secondary'>
          {detailIcons.map(
            ([detail, icon], index) =>
              detail && (
                <div className='flex items-center gap-1' key={icon}>
                  <i>
                    <HeroIcon className='h-5 w-5' iconName={icon} />
                  </i>
                  {index === 1 ? (
                    <a
                      className='custom-underline text-main-accent'
                      href={`https://${detail}`}
                      target='_blank'
                      rel='noreferrer'
                    >
                      {detail}
                    </a>
                  ) : index === 2 ? (
                    <button className='custom-underline group relative'>
                      {detail}
                      <ToolTip
                        className='translate-y-1'
                        tip={formatDate(createdAt, 'full')}
                      />
                    </button>
                  ) : (
                    <p>{detail}</p>
                  )}
                </div>
              )
          )}
        </div>
      </div>
      <div className='flex flex-wrap'>
        {interests.map((topic) => (
          <Link href={`/topic?url=${topic.url}`} key={topic.url} passHref>
            <a className='cursor-pointer pr-2 text-light-secondary hover:underline dark:text-dark-secondary'>
              <TopicView topic={topic} />
            </a>
          </Link>
        ))}
      </div>
      <UserFollowStats following={following} followers={followers} />
    </>
  );
}
