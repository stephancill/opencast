import { useAccount, useContractRead } from 'wagmi';
import { ID_REGISTRY } from '../../contracts';

function useFid() {
  const { address } = useAccount();

  const { data, error, isLoading } = useContractRead({
    ...ID_REGISTRY,
    chainId: 10,
    functionName: address ? 'idOf' : undefined,
    args: address ? [address] : undefined
  });

  return { data, error, isLoading };
}

export default useFid;
