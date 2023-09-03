import '@rainbow-me/rainbowkit/styles.css';
import '@styles/globals.scss';

import { AppHead } from '@components/common/app-head';
import { AuthContextProvider } from '@lib/context/auth-context';
import { ThemeContextProvider } from '@lib/context/theme-context';
import { RainbowKitProvider, getDefaultWallets } from '@rainbow-me/rainbowkit';
import type { NextPage } from 'next';
import type { AppProps } from 'next/app';
import type { ReactElement, ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { WagmiConfig, configureChains, createConfig } from 'wagmi';
import { arbitrum, base, mainnet, optimism, polygon, zora } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';

const queryClient = new QueryClient();

type NextPageWithLayout = NextPage & {
  getLayout?: (page: ReactElement) => ReactNode;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

const { chains, publicClient } = configureChains(
  [mainnet, polygon, optimism, arbitrum, base, zora],
  [publicProvider()]
);

const { connectors } = getDefaultWallets({
  appName: process.env.NEXT_PUBLIC_FC_CLIENT_NAME!,
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_ID!, // TODO: Make this optional
  chains
});

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient
});

export default function App({
  Component,
  pageProps
}: AppPropsWithLayout): ReactNode {
  const getLayout = Component.getLayout ?? ((page): ReactNode => page);

  return (
    <>
      <AppHead />
      <WagmiConfig config={wagmiConfig}>
        {/* TODO: Theme */}
        <RainbowKitProvider chains={chains}>
          <QueryClientProvider client={queryClient}>
            <AuthContextProvider>
              <ThemeContextProvider>
                {getLayout(<Component {...pageProps} />)}
              </ThemeContextProvider>
            </AuthContextProvider>
          </QueryClientProvider>
        </RainbowKitProvider>
      </WagmiConfig>
    </>
  );
}
