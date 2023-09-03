const footerLinks = [
  ['GitHub', 'https://github.com/stephancill/twitter-farcaster-client']
] as const;

export function AsideFooter(): JSX.Element {
  return (
    <footer
      className='sticky top-[33rem] flex flex-col gap-3 text-center text-sm
                 text-light-secondary dark:text-dark-secondary'
    >
      <nav className='flex flex-wrap justify-center gap-2'>
        {footerLinks.map(([linkName, href]) => (
          <a
            className='custom-underline'
            target='_blank'
            rel='noreferrer'
            href={href}
            key={href}
          >
            {linkName}
          </a>
        ))}
      </nav>
      <div></div>
      <p>Built by @stephancill. Use at own risk.</p>
    </footer>
  );
}
