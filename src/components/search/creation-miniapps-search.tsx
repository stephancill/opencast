'use client';

import { ModManifest } from '@mod-protocol/core';
import { Button } from 'components/ui/button';
import * as React from 'react';
import { SearchBar } from '../input/search-bar';

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
      <SearchBar
        inputValue={query}
        setInputValue={setQuery}
        onChange={(e) => setQuery(e.target.value)}
        className='mb-4'
      ></SearchBar>
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
                <div className='mr-2 flex h-7 w-7 items-center rounded-full bg-white'>
                  <img
                    src={m.logo}
                    className='mx-auto h-6 w-6 rounded-md '
                    alt={m.name}
                  ></img>
                </div>
                {m.name}
              </div>
            </Button>
          ))}
      </div>
    </div>
  );
}
