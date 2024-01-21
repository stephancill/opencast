import type { SyntheticEvent } from 'react';
import type { MotionProps } from 'framer-motion';

export function preventBubbling(
  callback?: (() => unknown) | null,
  noPreventDefault?: boolean
) {
  return (e: SyntheticEvent): void => {
    e.stopPropagation();

    if (!noPreventDefault) e.preventDefault();
    if (callback) callback();
  };
}

export function hasAncestorWithClass(element: HTMLElement, className: string) {
  let currentElement: HTMLElement | null = element;
  while (currentElement) {
    if (
      currentElement.classList &&
      currentElement.classList.contains(className)
    ) {
      return true;
    }
    currentElement = currentElement.parentElement;
  }
  return false;
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

type ParsedChainURL = {
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

  if (!scheme || !chainId || !contractType || !contractAddress) {
    throw new Error(`Invalid chain URL.`);
  }

  return {
    scheme,
    chainId,
    contractType,
    contractAddress
  };
}

export const truncateAddress = (address: string): string => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const replacer = (_: any, value: any) => {
  if (
    value !== null &&
    typeof value === 'object' &&
    'type' in value &&
    value.type === 'Buffer' &&
    'data' in value
  ) {
    // Convert Buffer to a hex string
    return Buffer.from(value).toString('hex');
  } else if (typeof value === 'bigint') {
    // Convert bigint to string
    return value.toString();
  }
  return value;
};

function JSONStringify<T>(data: T): string {
  return JSON.stringify(data, replacer);
}

function JSONParse<T>(data: string): T {
  return JSON.parse(data);
}

export function serialize<T>(data: T): T {
  return JSONParse(JSONStringify(data));
}
