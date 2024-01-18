import {
  getInsecureHubRpcClient,
  getSSLHubRpcClient,
  HubRpcClient
} from '@farcaster/hub-nodejs';
import {
  NEXT_PUBLIC_FC_HUB_URL,
  NEXT_PUBLIC_FC_HUB_USE_TLS,
  isProduction
} from '@lib/env';

const globalForFarcaster = global as unknown as {
  hubClient: HubRpcClient | undefined;
};

export const hubClient =
  globalForFarcaster.hubClient ??
  (NEXT_PUBLIC_FC_HUB_USE_TLS && NEXT_PUBLIC_FC_HUB_USE_TLS !== 'false'
    ? getSSLHubRpcClient(NEXT_PUBLIC_FC_HUB_URL)
    : getInsecureHubRpcClient(NEXT_PUBLIC_FC_HUB_URL));

if (!isProduction) globalForFarcaster.hubClient = hubClient;
