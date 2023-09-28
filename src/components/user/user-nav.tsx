import { motion } from 'framer-motion';
import cn from 'clsx';
import { variants } from '@components/user/user-header';
import { SegmentedNavLink } from '../ui/segmented-nav-link';

type UserNavProps = {
  follow?: boolean;
  userId: string;
};

const allNavs = [
  [
    { name: 'Casts', path: '' },
    { name: 'Casts & replies', path: '/with_replies' },
    // { name: 'Media', path: 'media' },
    { name: 'Likes', path: '/likes' }
  ],
  [
    { name: 'Following', path: 'following' },
    { name: 'Followers', path: 'followers' }
  ]
] as const;

export function UserNav({ follow, userId }: UserNavProps): JSX.Element {
  const userNav = allNavs[+!!follow];

  const userPath = `/user/${userId}`;

  return (
    <motion.nav
      className={cn(
        `hover-animation flex justify-between overflow-y-auto
         border-b border-light-border dark:border-dark-border`,
        follow && 'mb-0.5 mt-1'
      )}
      {...variants}
      exit={undefined}
    >
      {userNav.map(({ name, path }) => (
        <SegmentedNavLink name={name} path={`${userPath}${path}`} key={name} />
      ))}
    </motion.nav>
  );
}
