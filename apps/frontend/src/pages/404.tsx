import Error from 'next/error';
import { useTheme } from '@lib/context/theme-context';
import { SEO } from '@components/common/seo';

export default function NotFound(): JSX.Element {
  const { theme } = useTheme();

  const isDarkMode = ['dim', 'dark'].includes(theme);

  return (
    <>
      <SEO
        title='Page not found / Opencast'
        description='Sorry we couldn’t find the page you were looking for.'
        image='/404.png'
      />
      <Error statusCode={404} withDarkMode={isDarkMode} />
    </>
  );
}
