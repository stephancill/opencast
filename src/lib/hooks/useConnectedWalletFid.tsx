import { useAccount, useReadContract } from 'wagmi';
import { ID_REGISTRY } from '../../contracts';
import { useEffect } from 'react';

function useFid() {
  const { address } = useAccount();

  const { data, error, isLoading } = useReadContract({
    ...ID_REGISTRY,
    chainId: 10,
    functionName: address ? 'idOf' : undefined,
    args: address ? [address] : undefined
  });

  return { data, error, isLoading };
}

export default useFid;
