import cn from 'clsx';

type IconName = keyof typeof Icons;

type IconProps = {
  className?: string;
};

type CustomIconProps = IconProps & {
  iconName: IconName;
};

const Icons = {
  PinIcon,
  AppleIcon,
  PinOffIcon,
  GoogleIcon,
  TwitterIcon,
  FeatherIcon,
  SpinnerIcon,
  TriangleIcon
};

export function CustomIcon({
  iconName,
  className
}: CustomIconProps): JSX.Element {
  const Icon = Icons[iconName];

  return <Icon className={className ?? 'h-6 w-6'} />;
}

function TwitterIcon({ className }: IconProps): JSX.Element {
  return (
    <svg className={cn('fill-current', className)} viewBox='-1 -1 24 24'>
      <g>
        <path d='M20.3 18.75C20.6868 18.75 21 19.0576 21 19.4375V20.125H14V19.4375C14 19.0576 14.3132 18.75 14.7 18.75H20.3Z' />
        <path d='M20.3001 18.7499V18.0625C20.3001 17.6825 19.9868 17.3749 19.6001 17.3749H15.4001C15.0133 17.3749 14.7001 17.6825 14.7001 18.0625V18.7499H20.3001Z' />
        <path d='M17.5 0.875H3.5V3.625H17.5V0.875Z' />
        <path d='M20.3 6.37499H0.7L0 3.625H21L20.3 6.37499Z' />
        <path d='M19.6 6.375H15.4V17.375H19.6V6.375Z' />
        <path d='M6.3 18.75C6.68675 18.75 7 19.0576 7 19.4375V20.125H0V19.4375C0 19.0576 0.31325 18.75 0.7 18.75H6.3Z' />
        <path d='M6.30007 18.7499V18.0625C6.30007 17.6825 5.98682 17.3749 5.60007 17.3749H1.40007C1.01332 17.3749 0.700074 17.6825 0.700074 18.0625L0.700073 18.7499H6.30007Z' />
        <path d='M5.60002 6.375H1.40002V17.375H5.60002V6.375Z' />
        <path d='M5.59998 11.82C5.59998 9.16213 7.79378 7.0075 10.5 7.0075C13.2062 7.0075 15.4 9.16213 15.4 11.82V6.375H5.59998V11.82Z' />
      </g>
    </svg>
  );
}

function FeatherIcon({ className }: IconProps): JSX.Element {
  return (
    <svg
      className={cn('fill-current', className)}
      viewBox='0 0 24 24'
      aria-hidden='true'
    >
      <g>
        <path d='M23 3c-6.62-.1-10.38 2.421-13.05 6.03C7.29 12.61 6 17.331 6 22h2c0-1.007.07-2.012.19-3H12c4.1 0 7.48-3.082 7.94-7.054C22.79 10.147 23.17 6.359 23 3zm-7 8h-1.5v2H16c.63-.016 1.2-.08 1.72-.188C16.95 15.24 14.68 17 12 17H8.55c.57-2.512 1.57-4.851 3-6.78 2.16-2.912 5.29-4.911 9.45-5.187C20.95 8.079 19.9 11 16 11zM4 9V6H1V4h3V1h2v3h3v2H6v3H4z' />
      </g>
    </svg>
  );
}

function SpinnerIcon({ className }: IconProps): JSX.Element {
  return (
    <svg
      className={cn('animate-spin', className)}
      xmlns='http://www.w3.org/2000/svg'
      fill='none'
      viewBox='0 0 24 24'
    >
      <circle
        className='opacity-25'
        cx='12'
        cy='12'
        r='10'
        stroke='currentColor'
        strokeWidth='4'
      />
      <path
        className='opacity-75'
        fill='currentColor'
        d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
      />
    </svg>
  );
}

function GoogleIcon({ className }: IconProps): JSX.Element {
  return (
    <svg
      className={className}
      version='1.1'
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 48 48'
    >
      <g>
        <path
          fill='#EA4335'
          d='M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z'
        />
        <path
          fill='#4285F4'
          d='M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z'
        />
        <path
          fill='#FBBC05'
          d='M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z'
        />
        <path
          fill='#34A853'
          d='M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z'
        />
        <path fill='none' d='M0 0h48v48H0z' />
      </g>
    </svg>
  );
}

function AppleIcon({ className }: IconProps): JSX.Element {
  return (
    <svg className={className} viewBox='0 0 24 24'>
      <g>
        <path d='M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.9-1.99 1.57-2.987 1.57-.12 0-.23-.02-.3-.03-.01-.06-.04-.22-.04-.39 0-1.15.572-2.27 1.206-2.98.804-.94 2.142-1.64 3.248-1.68.03.13.05.28.05.43zm4.565 15.71c-.03.07-.463 1.58-1.518 3.12-.945 1.34-1.94 2.71-3.43 2.71-1.517 0-1.9-.88-3.63-.88-1.698 0-2.302.91-3.67.91-1.377 0-2.332-1.26-3.428-2.8-1.287-1.82-2.323-4.63-2.323-7.28 0-4.28 2.797-6.55 5.552-6.55 1.448 0 2.675.95 3.6.95.865 0 2.222-1.01 3.902-1.01.613 0 2.886.06 4.374 2.19-.13.09-2.383 1.37-2.383 4.19 0 3.26 2.854 4.42 2.955 4.45z' />
      </g>
    </svg>
  );
}

function TriangleIcon({ className }: IconProps): JSX.Element {
  return (
    <svg className={className} viewBox='0 0 24 24' aria-hidden='true'>
      <g>
        <path d='M12.538 6.478c-.14-.146-.335-.228-.538-.228s-.396.082-.538.228l-9.252 9.53c-.21.217-.27.538-.152.815.117.277.39.458.69.458h18.5c.302 0 .573-.18.69-.457.118-.277.058-.598-.152-.814l-9.248-9.532z' />
      </g>
    </svg>
  );
}

function PinIcon({ className }: IconProps): JSX.Element {
  return (
    <svg
      className={className}
      xmlns='http://www.w3.org/2000/svg'
      width='24'
      height='24'
      viewBox='0 0 24 24'
      strokeWidth='2'
      stroke='currentColor'
      fill='none'
      strokeLinecap='round'
      strokeLinejoin='round'
    >
      <path stroke='none' d='M0 0h24v24H0z' fill='none' />
      <path d='M15 4.5l-4 4l-4 1.5l-1.5 1.5l7 7l1.5 -1.5l1.5 -4l4 -4' />
      <line x1='9' y1='15' x2='4.5' y2='19.5' />
      <line x1='14.5' y1='4' x2='20' y2='9.5' />
    </svg>
  );
}

function PinOffIcon({ className }: IconProps): JSX.Element {
  return (
    <svg
      className={className}
      xmlns='http://www.w3.org/2000/svg'
      width='24'
      height='24'
      viewBox='0 0 24 24'
      strokeWidth='2'
      stroke='currentColor'
      fill='none'
      strokeLinecap='round'
      strokeLinejoin='round'
    >
      <path stroke='none' d='M0 0h24v24H0z' fill='none' />
      <line x1='3' y1='3' x2='21' y2='21' />
      <path d='M15 4.5l-3.249 3.249m-2.57 1.433l-2.181 .818l-1.5 1.5l7 7l1.5 -1.5l.82 -2.186m1.43 -2.563l3.25 -3.251' />
      <line x1='9' y1='15' x2='4.5' y2='19.5' />
      <line x1='14.5' y1='4' x2='20' y2='9.5' />
    </svg>
  );
}
