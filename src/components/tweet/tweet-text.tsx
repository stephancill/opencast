import Link from 'next/link';
import { useMemo } from 'react';
import { ImagesPreview } from '../../lib/types/file';
import { Mention } from '../../lib/types/tweet';
import { replaceOccurrencesMultiple } from '../../lib/utils';

export interface TweetTextProps {
  text: string;
  images: ImagesPreview | null;
  mentions: Mention[];
}

function splitAndInsert(
  input: string,
  indices: number[],
  insertions: JSX.Element[],
  elementBuilder: (s: string) => JSX.Element
) {
  let result = [];
  let lastIndex = 0;

  indices.forEach((index, i) => {
    result.push(elementBuilder(input.slice(lastIndex, index)));
    result.push(insertions[i]);
    lastIndex = index;
  });

  result.push(elementBuilder(input.slice(lastIndex))); // get remaining part of string

  return result;
}

const urlRegex = /(https?:\/\/[^\s]+)/g;

export function TweetText({
  text,
  images,
  mentions
}: TweetTextProps): JSX.Element {
  const indices = useMemo(
    () => mentions.map((mention) => mention.position),
    [mentions]
  );

  const segments = useMemo(() => {
    const segments = splitAndInsert(
      text,
      indices,
      mentions.map((mention) => {
        return (
          <Link href={`/user/${mention.username}`}>
            <p className='inline text-main-accent hover:cursor-pointer hover:underline'>{`@${mention.username}`}</p>
          </Link>
        );
      }),
      (s) => {
        return (
          <p className='inline'>
            {s.split(urlRegex).map((part, index) => {
              if (part.match(urlRegex)) {
                return (
                  <a target={'_blank'} key={index} href={part}>
                    <p className='inline text-main-accent hover:cursor-pointer hover:underline'>
                      {part}
                    </p>
                  </a>
                );
              } else {
                return replaceOccurrencesMultiple(
                  part,
                  images?.map((img) => img.src ?? '') ?? [],
                  ''
                );
              }
            })}
          </p>
        );
      }
    );
    return segments;
  }, [text, indices, mentions, images]);

  return <div className='whitespace-pre-line break-words'>{segments}</div>;
}
