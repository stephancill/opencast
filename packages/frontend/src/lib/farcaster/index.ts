import {
  getInsecureHubRpcClient,
  getSSLHubRpcClient,
  HubRpcClient
} from '@farcaster/hub-nodejs';

const globalForFarcaster = global as unknown as {
  hubClient: HubRpcClient | undefined;
};

export const hubClient =
  globalForFarcaster.hubClient ??
  (process.env.FC_HUB_USE_TLS && process.env.FC_HUB_USE_TLS !== 'false'
    ? getSSLHubRpcClient(process.env.FC_HUB_URL!)
    : getInsecureHubRpcClient(process.env.FC_HUB_URL!));

if (process.env.NODE_ENV !== 'production')
  globalForFarcaster.hubClient = hubClient;
