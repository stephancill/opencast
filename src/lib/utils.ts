import type { SyntheticEvent } from 'react';
import type { MotionProps } from 'framer-motion';

export function preventBubbling(
  callback?: ((...args: never[]) => unknown) | null,
  noPreventDefault?: boolean
) {
  return (e: SyntheticEvent): void => {
    e.stopPropagation();

    if (!noPreventDefault) e.preventDefault();
    if (callback) callback();
  };
}

export function delayScroll(ms: number) {
  return (): NodeJS.Timeout => setTimeout(() => window.scrollTo(0, 0), ms);
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getStatsMove(movePixels: number): MotionProps {
  return {
    initial: {
      opacity: 0,
      y: -movePixels
    },
    animate: {
      opacity: 1,
      y: 0
    },
    exit: {
      opacity: 0,
      y: movePixels
    },
    transition: {
      type: 'tween',
      duration: 0.15
    }
  };
}

export function isPlural(count: number): string {
  return count > 1 ? 's' : '';
}

export function replaceOccurrencesMultiple(
  text: string,
  occurrences: string[],
  replacement: string
): string {
  return occurrences.reduce(
    (acc, occurrence) => acc.replace(occurrence, replacement),
    text
  );
}

export type ParsedChainURL = {
  scheme: string;
  chainId: string;
  contractType: string;
  contractAddress: string;
};

export function parseChainURL(url: string): ParsedChainURL | null {
  const matches = url.match(
    /^(chain:\/\/)([\w\d]+):([\w\d]+)\/([\w\d]+):([\w\d]+)$/
  );

  if (!matches) {
    return null;
  }

  const [_, scheme, , chainId, contractType, contractAddress] = matches;

  return {
    scheme,
    chainId,
    contractType,
    contractAddress
  };
}

const replacer = (_: any, value: any) =>
  typeof value === 'bigint' ? value.toString() : value;

export function JSONStringify<T>(data: T): string {
  return JSON.stringify(data, replacer);
}

export function JSONParse<T>(data: string): T {
  return JSON.parse(data);
}

export function serialize<T>(data: T): T {
  return JSONParse(JSONStringify(data));
}
