'use client';

import { FarcasterFrameContext } from '@frames.js/render/farcaster';
import { useFrame } from '@frames.js/render/use-frame';
import { Frame as FrameType } from 'frames.js';
import { useFrameConfig } from '../../lib/context/frame-config-context';
import { FrameUI } from './frame-ui';

type FrameProps = {
  url: string;
  frame: FrameType;
  frameContext: FarcasterFrameContext;
};

export function Frame({ frame, frameContext, url }: FrameProps) {
  const { frameConfig } = useFrameConfig();

  const frameState = useFrame({
    homeframeUrl: url,
    frame,
    frameContext,
    ...frameConfig
  });

  return (
    <div className='w-full overflow-hidden'>
      <FrameUI frameState={frameState} />
    </div>
  );
}
