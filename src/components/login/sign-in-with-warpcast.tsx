import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import QRCode from 'react-qr-code';
import { useAuth } from '../../lib/context/auth-context';
import { generateKeyPair } from '../../lib/crypto';
import { fetchJSON } from '../../lib/fetch';
import { KeyPair } from '../../lib/types/keypair';
import { BaseResponse } from '../../lib/types/responses';
import { addKeyPair } from '../../lib/keys';

const PENDING_REQUEST_KEY = '-opencast-pendingWarpcastRequest';

type WarpcastSignerResponseBase = {
  token: string;
  deeplinkUrl: string;
  key: string;
  state: 'pending' | 'approved' | 'completed';
  userFid?: number;
};

type WarpcastRequest =
  | (WarpcastSignerResponseBase & {
      keyPair: KeyPair;
      authorization: { deadline: number };
    })
  | {
      state: 'preparing';
      keyPair: KeyPair;
    };

/* https://warpcast.notion.site/Signer-Request-API-Migration-Guide-Public-9e74827f9070442fb6f2a7ffe7226b3c */

const WarpcastAuthPopup = ({ closeModal }: { closeModal?: () => void }) => {
  const [pendingRequest, setPendingRequest] = useState<WarpcastRequest | null>(
    null
  );
  const [polling, setPolling] = useState<boolean>(false);
  const [deepLinkUrl, setDeepLinkUrl] = useState<string | null>(null);
  const [initiated, setInitiated] = useState<boolean>(false);
  const { handleUserAuth } = useAuth();

  useEffect(() => {
    if (pendingRequest) {
      localStorage.setItem(PENDING_REQUEST_KEY, JSON.stringify(pendingRequest));

      if (pendingRequest.state === 'preparing') {
        // Get app signature
        (
          fetchJSON(
            `/api/signer/${pendingRequest!.keyPair.publicKey}/authorize`
          ) as Promise<
            BaseResponse<{
              requestFid: number;
              signature: string;
              deadline: number;
            }>
          >
        ).then(({ result: authorizationResult }) => {
          if (!authorizationResult) {
            toast.error('Error generating signature');
            return;
          } else {
            // Send signature to Warpcast for transaction broadcast
            (
              fetchJSON(`https://api.warpcast.com/v2/signed-key-requests`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  key: pendingRequest?.keyPair.publicKey,
                  signature: authorizationResult.signature,
                  requestFid: authorizationResult.requestFid,
                  deadline: authorizationResult.deadline
                })
              }) as Promise<{
                result: { signedKeyRequest: WarpcastSignerResponseBase };
              }>
            ).then(({ result }) => {
              if (!result) {
                toast.error('Error generating signed key');
                return;
              }

              setPendingRequest({
                ...result.signedKeyRequest,
                keyPair: pendingRequest!.keyPair,
                authorization: authorizationResult
              });
            });
          }
        });
      } else if (pendingRequest.state === 'pending') {
        setDeepLinkUrl(pendingRequest.deeplinkUrl);
        if (!polling) {
          pollForSigner(pendingRequest.token);
        }
      } else if (pendingRequest.state === 'completed') {
        setTimeout(() => {
          addKeyPair(pendingRequest.keyPair);
          localStorage.removeItem(PENDING_REQUEST_KEY);
          handleUserAuth(pendingRequest.keyPair);
          closeModal?.();
        }, 5_000); // Give indexer 5 seconds to index event
      }
    }
  }, [pendingRequest]);

  // Initiate the Signer request
  const initiateSignerRequest = async () => {
    // Load existing request
    const pendingWarpcastRequestRaw = localStorage.getItem(
      PENDING_REQUEST_KEY
    ) as string;

    let request: WarpcastRequest | undefined;

    if (pendingWarpcastRequestRaw) {
      const parsed: WarpcastRequest = JSON.parse(pendingWarpcastRequestRaw);
      // Check that request is still valid
      if (
        parsed.state !== 'preparing' &&
        parsed.authorization.deadline &&
        parsed.authorization.deadline > Math.floor(Date.now() / 1000)
      ) {
        request = parsed;
      }
    }

    if (!request) {
      request = {
        state: 'preparing',
        keyPair: await generateKeyPair()
      };
      localStorage.setItem(PENDING_REQUEST_KEY, JSON.stringify(request));
    }

    setPendingRequest(request);
  };

  // Poll for the status of the Signer request
  // TODO: Loading indicators
  const pollForSigner = async (token: string) => {
    if (pendingRequest?.state !== 'pending') return;

    setPolling(true);
    let tries = 0;
    // TODO: Loading indicators
    while (true || tries < 40) {
      tries += 1;
      await new Promise((r) => setTimeout(r, 2000));

      const { result } = (await fetchJSON(
        `https://api.warpcast.com/v2/signed-key-request?token=${token}`
      )) as { result: { signedKeyRequest: WarpcastSignerResponseBase } };

      setPendingRequest({
        ...result.signedKeyRequest,
        keyPair: pendingRequest.keyPair,
        authorization: pendingRequest.authorization
      });

      if (result.signedKeyRequest.state === 'completed') {
        break;
      }
    }
  };

  useEffect(() => {
    setInitiated(true);
  }, []);

  // Debounced
  useEffect(() => {
    if (initiated) {
      initiateSignerRequest();
    }
  }, [initiated]);

  return (
    <div>
      {deepLinkUrl && (
        <div>
          <div className={'rounded bg-white p-2'}>
            <QRCode value={deepLinkUrl} />{' '}
          </div>
          <span className='pt-4 text-gray-500'>
            On mobile?{' '}
            <a className='underline' href={deepLinkUrl} target={'_blank'}>
              Open in Warpcast
            </a>
          </span>
        </div>
      )}
    </div>
  );
};

export default WarpcastAuthPopup;
