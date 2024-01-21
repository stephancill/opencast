import { Button } from '@components/ui/button';
import { CustomIcon } from '@components/ui/custom-icon';
import { NextImage } from '@components/ui/next-image';
import { usePrivy } from '@privy-io/react-auth';

export function LoginMain(): JSX.Element {
  const { ready, authenticated, login, connectWallet } = usePrivy();

  return (
    <main className='grid lg:grid-cols-[1fr,45vw]'>
      <div className='relative hidden items-center justify-center  lg:flex'>
        <NextImage
          imgClassName='object-cover'
          blurClassName='bg-accent-blue'
          src='/assets/twitter-banner.png'
          alt='Opencast banner'
          layout='fill'
          useSkeleton
        />
        <i className='absolute'>
          <CustomIcon className='h-96 w-96 text-white' iconName='TwitterIcon' />
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
          <>
            <p>You are not authenticated with Privy</p>
            <div className='flex items-center gap-4'>
              <Button onClick={login}>Login with Privy</Button>
              <span>or</span>
              <Button onClick={connectWallet}>Connect only</Button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
