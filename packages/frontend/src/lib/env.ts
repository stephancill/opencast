if (!process.env.NEXT_PUBLIC_URL) {
  throw new Error('NEXT_PUBLIC_URL is not defined');
}

if (!process.env.NEXT_PUBLIC_MOD_API_URL) {
  throw new Error('NEXT_PUBLIC_MOD_API_URL is not defined');
}

if (!process.env.NEXT_PUBLIC_FC_HUB_URL) {
  throw new Error('FC_HUB_URL is not defined');
}

if (!process.env.NEXT_PUBLIC_FC_CLIENT_NAME) {
  throw new Error('NEXT_PUBLIC_FC_CLIENT_NAME is not defined');
}

if (!process.env.NEXT_PUBLIC_WALLETCONNECT_ID) {
  throw new Error('NEXT_PUBLIC_WALLETCONNECT_ID is not defined');
}

if (!process.env.NEXT_PUBLIC_APP_FID) {
  throw new Error('NEXT_PUBLIC_APP_FID is not defined');
}

if (!process.env.NEXT_PUBLIC_APP_SIGNER_PK) {
  throw new Error('APP_SIGNER_PK is not defined');
}

export const isProduction = process.env.NODE_ENV === 'production';
export const isDevelopment = process.env.NODE_ENV === 'development';

export const NEXT_PUBLIC_URL = process.env.NEXT_PUBLIC_URL;
export const NEXT_PUBLIC_MOD_API_URL = process.env.NEXT_PUBLIC_MOD_API_URL;
export const NEXT_PUBLIC_FC_HUB_USE_TLS =
  process.env.NEXT_PUBLIC_FC_HUB_USE_TLS;
export const NEXT_PUBLIC_FC_HUB_URL = process.env.NEXT_PUBLIC_FC_HUB_URL;
export const NEXT_PUBLIC_FC_CLIENT_NAME =
  process.env.NEXT_PUBLIC_FC_CLIENT_NAME;
export const NEXT_PUBLIC_WALLETCONNECT_ID =
  process.env.NEXT_PUBLIC_WALLETCONNECT_ID;
export const NEXT_PUBLIC_APP_FID = process.env.NEXT_PUBLIC_APP_FID;
export const NEXT_PUBLIC_APP_SIGNER_PK = process.env.NEXT_PUBLIC_APP_SIGNER_PK;
