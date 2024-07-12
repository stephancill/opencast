import Link from 'next/link';
import { useMemo, useState } from 'react';
import useSWR from 'swr';
import { ExternalEmbed } from '../../lib/types/tweet';
import { NextImage } from '../ui/next-image';
import { ImagePreview } from '@components/input/image-preview';
import { Frame } from '@components/frames/Frame';
import { Frame as FrameType } from 'frames.js';

const hoverModifier =
  'hover:brightness-75 dark:hover:brightness-125 hover:duration-200 transition';

export function TweetEmbeds({
  embeds,
  tweetId,
  tweetAuthorId
}: {
  embeds: ExternalEmbed[];
  tweetId: string;
  tweetAuthorId: string;
}) {
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

  const imageEmbeds = useMemo(() => {
    return embedsData?.filter((embed) =>
      embed?.contentType?.startsWith('image/')
    );
  }, [embedsData]);

  const frames = useMemo(() => {
    return embedsData?.filter((embed) => embed?.frame);
  }, [embedsData]);

  return embedsData !== undefined ? (
    embedsData && embedsCount > 0 && (
      <div>
        {imageEmbeds && imageEmbeds.length > 0 && (
          <div>
            <ImagePreview
              tweet
              imagesPreview={imageEmbeds.map((e) => ({
                alt: e?.title || '',
                id: e!.url,
                src: e!.url
              }))}
              previewCount={imageEmbeds.length}
            />
          </div>
        )}
        <div className={embedsCount > 1 ? `mt-2 grid gap-2` : 'mt-2'}>
          {embedsData?.map((embed, index) =>
            embed &&
            !embed.contentType?.startsWith('image/') &&
            !embed.frame ? (
              <TweetEmbed {...embed} key={index}></TweetEmbed>
            ) : (
              <></>
            )
          )}
        </div>
        {frames?.map((embed) => (
          <div key={embed?.url}>
            <FramePreview
              embed={embed!}
              url={embed!.url}
              tweetAuthorId={tweetAuthorId}
              tweetId={tweetId}
            />
          </div>
        ))}
      </div>
    )
  ) : (
    <div className={embeds.length > 1 ? `mt-2 grid gap-2` : 'mt-2'}>
      {embeds?.map((embed, index) =>
        embed ? (
          <TweetEmbed {...embed} key={index} isLoading={true}></TweetEmbed>
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
  isLoading,
  newTab,
  buttonTitle,
  onButtonClick
}: ExternalEmbed & {
  isLoading?: boolean;
  newTab?: boolean;
  buttonTitle?: string;
  onButtonClick?: () => void;
}): JSX.Element {
  const imageEl = (
    <div>
      <div className='ml-auto h-[100px] w-[100px] overflow-hidden rounded-md'>
        {image ? (
          <img
            src={image}
            alt={title || ''}
            title={title || 'Unknown'}
            className='h-full w-full object-cover'
          />
        ) : isLoading ? (
          <div className='animate-pulse rounded-md bg-light-secondary dark:bg-dark-secondary sm:block'></div>
        ) : (
          <div className='rounded-md bg-light-secondary dark:bg-dark-secondary sm:block'></div>
        )}
      </div>
    </div>
  );

  const link = (
    <div>
      <Link
        href={url}
        className='override-nav'
        target={newTab ? '_blank' : url.startsWith('/') ? undefined : '_blank'}
      >
        <div
          className='flex w-full gap-2 rounded-md border 
border-black border-light-border p-2 text-left text-sm dark:border-dark-border'
        >
          {buttonTitle ? imageEl : <></>}
          <div className='flex min-w-0 flex-grow flex-col justify-center'>
            <div className='break-word flex items-center [overflow-wrap:anywhere]'>
              {icon && (
                // Only fully rounded if it's a link to a cast
                <span
                  className={`mx-1 flex-shrink-0 overflow-hidden ${
                    url.startsWith('/tweet') ? 'rounded-full' : 'rounded-sm'
                  }`}
                >
                  <img
                    src={icon}
                    alt={provider || ''}
                    className='h-4 w-4 object-cover'
                  />
                </span>
              )}
              {title && (
                <span
                  className={`mx-1 line-clamp-2 text-ellipsis ${hoverModifier}`}
                >
                  {title}
                </span>
              )}
            </div>
            {text ? (
              <span
                className={`mx-1 line-clamp-3 text-gray-400 ${hoverModifier}`}
              >
                {text}
              </span>
            ) : isLoading ? (
              <div className='h-12 w-full animate-pulse rounded-md bg-light-secondary dark:bg-dark-secondary'></div>
            ) : (
              <></>
            )}
          </div>
          {!buttonTitle ? (
            imageEl
          ) : (
            <div className='my-auto flex'>
              <button
                onClick={onButtonClick}
                className='rounded-md bg-main-accent p-2 font-bold'
              >
                {buttonTitle}
              </button>
            </div>
          )}
        </div>
      </Link>
      <div className='text-right text-sm text-light-secondary dark:text-dark-secondary'>
        {URL.canParse(url) ? new URL(url).hostname : ''}
      </div>
    </div>
  );

  return link;
}

export function FramePreview({
  url,
  tweetAuthorId,
  tweetId,
  embed: { frame, ...embed }
}: {
  url: string;
  tweetAuthorId: string;
  tweetId: string;
  embed: ExternalEmbed;
}) {
  const [showFrame, setShowFrame] = useState(false);

  const handleToggleFrame = () => {
    setShowFrame(!showFrame);
  };

  return showFrame && frame ? (
    <div className='override-nav flex justify-center rounded-md'>
      <Frame
        url={url}
        frame={frame}
        frameContext={{
          castId: {
            fid: parseInt(tweetAuthorId),
            hash: `0x${tweetId}`
          }
        }}
      />
    </div>
  ) : (
    <div
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        handleToggleFrame();
      }}
    >
      <TweetEmbed
        {...embed}
        buttonTitle={'View'}
        onButtonClick={handleToggleFrame}
        url={url}
      ></TweetEmbed>
    </div>
  );
}
