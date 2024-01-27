import '@styles/globals.scss';

import { PrivyProvider, User } from '@privy-io/react-auth';
import type { NextPage } from 'next';
import type { AppProps } from 'next/app';
import type { ReactElement, ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { configureChains } from 'wagmi';
import { mainnet, optimism, sepolia } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
import { PrivyWagmiConnector } from '@privy-io/wagmi-connector';

const queryClient = new QueryClient();

type NextPageWithLayout = NextPage & {
  getLayout?: (page: ReactElement) => ReactNode;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

const wagmiChainsConfig = configureChains(
  [mainnet, optimism, sepolia],
  // TODO: replace with Alchemy?
  [publicProvider()]
);

function App({ Component, pageProps }: AppPropsWithLayout): ReactNode {
  const getLayout = Component.getLayout ?? ((page): ReactNode => page);

  if (!process.env.NEXT_PUBLIC_PRIVY_APP_ID) {
    throw new Error('Missing NEXT_PUBLIC_PRIVY_APP_ID env variable');
  }

  const handleLogin = (user: User) => {
    console.log(`User ${user.id} logged in!`);
  };

  return (
    <>
      <PrivyProvider
        appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID}
        onSuccess={handleLogin}
      >
        <PrivyWagmiConnector wagmiChainsConfig={wagmiChainsConfig}>
          <QueryClientProvider client={queryClient}>
            {getLayout(<Component {...pageProps} />)}
          </QueryClientProvider>
        </PrivyWagmiConnector>
      </PrivyProvider>
    </>
  );
}

export default App;
