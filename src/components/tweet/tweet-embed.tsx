import { useMemo } from 'react';
import useSWR from 'swr';
import { ExternalEmbed } from '../../lib/types/tweet';
import { preventBubbling } from '../../lib/utils';
import { NextImage } from '../ui/next-image';

const hoverModifier =
  'hover:brightness-75 dark:hover:brightness-125 hover:duration-200 transition';

export function TweetEmbeds({ embeds }: { embeds: ExternalEmbed[] }) {
  const fetchEmbeds = async (url: string | null) => {
    if (!url) return null;

    const res = await fetch(url);
    if (!res.ok) {
      return null;
    }

    const data = (await res.json()) as (ExternalEmbed | null)[];
    return data;
  };

  const url = useMemo(() => {
    return embeds.map((embed) => embed.url).join(',');
  }, embeds);

  const { data: embedsData } = useSWR(`/api/embeds?urls=${url}`, fetchEmbeds, {
    revalidateOnFocus: false
  });

  const embedsCount = useMemo(() => {
    return embedsData?.filter((embed) => embed !== null).length || 0;
  }, [embedsData]);

  return embedsData !== undefined ? (
    embedsData && embedsCount > 0 && (
      <div className={embedsCount > 1 ? `mt-2 grid gap-2` : 'mt-2'}>
        {embedsData?.map((embed) =>
          embed ? <TweetEmbed {...embed} key={embed.url}></TweetEmbed> : <></>
        )}
      </div>
    )
  ) : (
    <div className={embeds.length > 1 ? `mt-2 grid gap-2` : 'mt-2'}>
      {embeds?.map((embed) =>
        embed ? (
          <TweetEmbed {...embed} key={embed.url} isLoading={true}></TweetEmbed>
        ) : (
          <></>
        )
      )}
    </div>
  );
}

export function TweetEmbed({
  title,
  text,
  image,
  provider,
  url,
  icon,
  isLoading
}: ExternalEmbed & { isLoading?: boolean }): JSX.Element {
  return (
    <button
      className='w-full rounded-md border border-black border-light-border 
    p-2  text-left text-sm dark:border-dark-border'
      onClick={preventBubbling(() => window.open(url, '_blank'))}
    >
      <a href={url} target={'_blank'}>
        <div className='flex items-center'>
          <div className='flex-grow'>
            <div className='flex items-center'>
              {icon && (
                <span className='mx-1'>
                  <NextImage
                    src={icon}
                    alt={provider || ''}
                    width={16}
                    height={16}
                  ></NextImage>
                </span>
              )}
              {title && (
                <span
                  className={`mx-1 line-clamp-2 overflow-hidden text-ellipsis ${hoverModifier}`}
                >
                  {title}
                </span>
              )}
            </div>
            {text ? (
              <span
                className={`mx-1 line-clamp-4 text-gray-400 ${hoverModifier}`}
              >
                {text
                  .split(' ')
                  .map((word) =>
                    word.length > 40 ? word.slice(0, 20) + '...' : word
                  )
                  .join(' ')}
              </span>
            ) : isLoading ? (
              <div className='h-12 w-full animate-pulse rounded-md bg-light-secondary dark:bg-dark-secondary'></div>
            ) : (
              <></>
            )}
          </div>
          {image ? (
            <div className='ml-2 mr-1 block hidden h-28 w-28 flex-shrink-0 flex-grow-0 overflow-hidden rounded-md sm:block'>
              <NextImage
                src={image}
                alt={title || ''}
                title={title || 'Unknown'}
                className='h-full w-full object-cover'
                width={112}
                height={112}
              />
            </div>
          ) : isLoading ? (
            <div className='ml-2 mr-1 block hidden h-28 w-28 flex-shrink-0 flex-grow-0 animate-pulse overflow-hidden rounded-md rounded-md bg-light-secondary dark:bg-dark-secondary sm:block'></div>
          ) : (
            <></>
          )}
        </div>
      </a>
    </button>
  );
}
