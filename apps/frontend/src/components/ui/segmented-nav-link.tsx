import { useRouter } from 'next/router';
import Link from 'next/link';
import cn from 'clsx';

type SegmentedNavLinkProps = {
  name: string;
  path?: string;
  onClick?: () => void;
  isActive?: boolean;
};

export function SegmentedNavLink({
  name,
  path = '#',
  onClick,
  isActive
}: SegmentedNavLinkProps): JSX.Element {
  const { asPath } = useRouter();

  return (
    <Link href={path} scroll={false} passHref>
      <a
        className='hover-animation main-tab dark-bg-tab flex flex-1 justify-center
                   hover:bg-light-primary/10 dark:hover:bg-dark-primary/10'
      >
        <div className='px-6 md:px-8' onClick={onClick}>
          <p
            className={cn(
              'flex flex-col gap-3 whitespace-nowrap pt-3 font-bold transition-colors duration-200',
              !!isActive || asPath === path
                ? 'text-light-primary dark:text-dark-primary [&>i]:scale-100 [&>i]:opacity-100'
                : 'text-light-secondary dark:text-dark-secondary'
            )}
          >
            {name}
            <i className='h-1 scale-50 rounded-full bg-main-accent opacity-0 transition duration-200' />
          </p>
        </div>
      </a>
    </Link>
  );
}
