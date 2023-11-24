'use client';

import { Embed } from '@mod-protocol/core';
import {
  contentMiniApps,
  defaultContentMiniApp
} from '@mod-protocol/miniapp-registry';
import { RenderEmbed } from '@mod-protocol/react';
import { renderers } from '@mod-protocol/react-ui-shadcn/dist/renderers';
import { NextImage } from '../ui/next-image';

export function ModEmbeds(props: { embeds: Array<Embed> }) {
  return (
    <div>
      {props.embeds.map((embed, i) =>
        embed.metadata && Object.keys(embed.metadata).length > 0 ? (
          <RenderEmbed
            api={process.env.NEXT_PUBLIC_MOD_API_URL!}
            embed={embed}
            key={i}
            renderers={{
              ...renderers
            }}
            defaultContentMiniApp={defaultContentMiniApp}
            contentMiniApps={contentMiniApps}
          />
        ) : null
      )}
    </div>
  );
}
