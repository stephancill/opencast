'use client';

import React from 'react';
import { renderers } from '@mod-protocol/react-ui-shadcn/dist/renderers';
import { RenderEmbed } from '@mod-protocol/react';
import { Embed } from '@mod-protocol/core';
import {
  defaultContentMiniApp,
  contentMiniApps
} from '@mod-protocol/miniapp-registry';

export function ModEmbeds(props: { embeds: Array<Embed> }) {
  return (
    <div>
      {props.embeds.map((embed, i) =>
        embed.metadata && Object.keys(embed.metadata).length > 0 ? (
          <RenderEmbed
            api={'https://api.modprotocol.org'}
            embed={embed}
            key={i}
            renderers={renderers}
            defaultContentMiniApp={defaultContentMiniApp}
            contentMiniApps={contentMiniApps}
          />
        ) : null
      )}
    </div>
  );
}
