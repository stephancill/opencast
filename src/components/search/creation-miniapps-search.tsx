'use client';

import { ModManifest } from '@mod-protocol/core';
import cn from 'clsx';
import { Button } from 'components/ui/button';
import * as React from 'react';

type Props = {
  miniapps: ModManifest[];
  onSelect: (value: ModManifest) => void;
  open: boolean;
  setOpen: (value: boolean) => void;
};

export function CreationMiniAppsSearch(props: Props) {
  const { miniapps, onSelect, open, setOpen } = props;
  const [query, setQuery] = React.useState('');

  const handleSelect = React.useCallback(
    (id: string) => {
      const miniapp = miniapps.find((m) => m.slug === id);
      if (miniapp) {
        // TODO: this needs to happen in input-options.tsx
        setOpen(false);
        onSelect(miniapp);
      }
    },
    [onSelect, miniapps]
  );

  return (
    <div>
      <input
        className={cn(
          'flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50'
        )}
        placeholder='Search Mini-apps...'
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      ></input>
      <div className='flex flex-col'>
        {miniapps
          .filter((m) => m.name.toLowerCase().includes(query.toLowerCase()))
          .map((m) => (
            <Button
              key={m.slug}
              className='dark:hover:bg-dark-accent dark:hover:text-dark-accent flex w-full items-center justify-between text-left hover:bg-main-accent/10 hover:text-main-accent'
              onClick={() => handleSelect(m.slug)}
            >
              <div className='flex items-center'>
                <img
                  src={m.logo}
                  className='mr-2 h-6 w-6 rounded-md'
                  alt={m.name}
                ></img>
                {m.name}
              </div>
            </Button>
          ))}
      </div>
    </div>
  );
}
