import { AuthLayout } from '@components/layout/auth-layout';
import { SEO } from '@components/common/seo';
import type { ReactElement, ReactNode } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { NextImage } from '@components/ui/next-image';
import { CustomIcon } from '@components/ui/custom-icon';
import { Button } from '@components/ui/button';
import React from 'react';

export default function Login(): JSX.Element {
  const { ready, authenticated, login, connectWallet } = usePrivy();

  return (
    <div className='grid min-h-screen grid-rows-[1fr,auto]'>
      <SEO title='Selekt' description='Log in to Selekt' />
      <main className='grid lg:grid-cols-[1fr,45vw]'>
        <div className='relative hidden items-center justify-center  lg:flex'>
          <NextImage
            imgClassName='object-cover'
            blurClassName='bg-accent-blue'
            src='/assets/twitter-banner.png'
            alt='Selekt banner'
            layout='fill'
            useSkeleton
          />
          <i className='absolute'>
            <CustomIcon
              className='h-96 w-96 text-white'
              iconName='TwitterIcon'
            />
          </i>
        </div>
        <div className='flex flex-col items-center justify-between gap-6 p-8 lg:items-start lg:justify-center'>
          <i className='mb-0 self-center lg:mb-10 lg:self-auto'>
            <CustomIcon
              className='-mt-4 h-6 w-6 text-accent-blue lg:h-12 lg:w-12 dark:lg:text-twitter-icon'
              iconName='TwitterIcon'
            />
          </i>
          {ready && !authenticated && (
            <div className='flex items-center gap-4'>
              <Button onClick={login}>Login</Button>
            </div>
          )}
        </div>
      </main>
      <footer className='hidden justify-center p-4 text-sm text-light-secondary dark:text-dark-secondary lg:flex'>
        <nav className='flex flex-wrap justify-center gap-4 gap-y-2'>
          <p>Selekt</p>
        </nav>
      </footer>
    </div>
  );
}

Login.getLayout = (page: ReactElement): ReactNode => (
  <AuthLayout>{page}</AuthLayout>
);
