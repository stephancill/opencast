'use client';

import { Embed } from '@mod-protocol/core';
import {
  richEmbedModsExperimental as richEmbedMods,
  defaultRichEmbedMod
} from '@mod-protocol/mod-registry';
import { RichEmbed } from '@mod-protocol/react';
import { renderers } from '@mod-protocol/react-ui-shadcn/dist/renderers';
import {
  sendTransaction,
  switchNetwork,
  waitForTransaction
} from '@wagmi/core';
import { useAccount, useNetwork } from 'wagmi';

export function ModEmbeds(props: { embeds: Array<Embed> }) {
  const { address } = useAccount();
  const network = useNetwork();

  return (
    <div>
      {props.embeds.map((embed, i) =>
        embed.metadata && Object.keys(embed.metadata).length > 0 ? (
          <RichEmbed
            api={process.env.NEXT_PUBLIC_MOD_API_URL!}
            embed={embed}
            key={i}
            renderers={{
              ...renderers,
              Video: () => <div>Video not supported</div>
            }}
            defaultRichEmbedMod={defaultRichEmbedMod}
            mods={richEmbedMods}
            user={{
              wallet: address
                ? {
                    address: address
                  }
                : undefined
            }}
            resolvers={{
              async onSendEthTransactionAction(
                { data, chainId },
                { onConfirmed, onError, onSubmitted }
              ) {
                try {
                  const parsedChainId = parseInt(chainId);

                  // Switch chains if the user is not on the right one
                  if (network.chain?.id !== parsedChainId)
                    await switchNetwork({ chainId: parsedChainId });

                  // Send the transaction
                  const { hash } = await sendTransaction({
                    ...data,
                    value: data.value ? BigInt(data.value) : 0n,
                    data: (data.data as `0x${string}`) || '0x',
                    chainId: parsedChainId
                  });
                  onSubmitted(hash);

                  // Wait for the transaction to be confirmed
                  const { status } = await waitForTransaction({
                    hash,
                    chainId: parsedChainId
                  });

                  onConfirmed(hash, status === 'success');
                } catch (e: any) {
                  console.error(e);
                  onError(e);
                }
              }
            }}
          />
        ) : null
      )}
    </div>
  );
}
