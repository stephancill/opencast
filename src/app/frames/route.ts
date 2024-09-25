import { type FrameActionPayload, getFrame } from 'frames.js';
import { type NextRequest } from 'next/server';
import type { SupportedParsingSpecification } from 'frames.js';
import { z } from 'zod';
import type { ParseResult } from 'frames.js/frame-parsers';
import type { ParsingReport } from 'frames.js';

export type ParseActionResult =
  | {
      status: 'success';
      action: any;
      /**
       * Reports contain only warnings that should not have any impact on the frame's functionality.
       */
      reports: Record<string, ParsingReport[]>;
    }
  | {
      status: 'failure';
      action: any;
      /**
       * Reports contain warnings and errors that should be addressed before the frame can be used.
       */
      reports: Record<string, ParsingReport[]>;
    };

const castActionMessageParser = z.object({
  type: z.literal('message'),
  message: z.string().min(1)
});

const castActionFrameParser = z.object({
  type: z.literal('frame'),
  frameUrl: z.string().min(1).url()
});

const composerActionFormParser = z.object({
  type: z.literal('form'),
  url: z.string().min(1).url(),
  title: z.string().min(1)
});

const jsonResponseParser = z.preprocess((data) => {
  if (typeof data === 'object' && data !== null && !('type' in data)) {
    return {
      type: 'message',
      ...data
    };
  }

  return data;
}, z.discriminatedUnion('type', [castActionFrameParser, castActionMessageParser, composerActionFormParser]));

const errorResponseParser = z.object({
  message: z.string().min(1)
});

export type CastActionDefinitionResponse = ParseActionResult & {
  type: 'action';
  url: string;
};

export type FrameDefinitionResponse = ParseResult & {
  type: 'frame';
};

export function isSpecificationValid(
  specification: unknown
): specification is SupportedParsingSpecification {
  return (
    typeof specification === 'string' &&
    ['farcaster', 'openframes'].includes(specification)
  );
}

export { GET } from '@frames.js/render/next';

/** Proxies frame actions to avoid CORS issues and preserve user IP privacy */
export async function POST(req: NextRequest): Promise<Response> {
  const body = (await req.clone().json()) as FrameActionPayload;
  const isPostRedirect =
    req.nextUrl.searchParams.get('postType') === 'post_redirect';
  const isTransactionRequest =
    req.nextUrl.searchParams.get('postType') === 'tx';
  const postUrl = req.nextUrl.searchParams.get('postUrl');
  const specification =
    req.nextUrl.searchParams.get('specification') ?? 'farcaster';

  if (!isSpecificationValid(specification)) {
    return Response.json({ message: 'Invalid specification' }, { status: 400 });
  }

  if (!postUrl) {
    return Response.error();
  }

  try {
    const r = await fetch(postUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      redirect: isPostRedirect ? 'manual' : undefined,
      body: JSON.stringify(body)
    });

    if (r.status === 302) {
      return Response.json(
        {
          location: r.headers.get('location')
        },
        { status: 302 }
      );
    }

    // this is an error, just return response as is
    if (r.status >= 500) {
      return Response.json(await r.text(), { status: r.status });
    }

    if (r.status >= 400 && r.status < 500) {
      const parseResult = await z
        .promise(errorResponseParser)
        .safeParseAsync(r.clone().json());

      if (!parseResult.success) {
        return Response.json(
          { message: await r.clone().text() },
          { status: r.status }
        );
      }

      return r.clone();
    }

    if (isPostRedirect && r.status !== 302) {
      return Response.json(
        {
          message: `Invalid response status code for post redirect button, 302 expected, got ${r.status}`
        },
        { status: 400 }
      );
    }

    if (isTransactionRequest) {
      const transaction = (await r.json()) as JSON;
      return Response.json(transaction);
    }

    // Content type is JSON, could be an action
    if (r.headers.get('content-type')?.includes('application/json')) {
      const parseResult = await z
        .promise(jsonResponseParser)
        .safeParseAsync(r.clone().json());

      if (!parseResult.success) {
        throw new Error('Invalid frame response');
      }

      return r.clone();
    }

    const htmlString = await r.text();

    const result = getFrame({
      htmlString,
      url: body.untrustedData.url,
      specification,
      fromRequestMethod: 'POST'
    });

    return Response.json(result);
  } catch (err) {
    // eslint-disable-next-line no-console -- provide feedback to the user
    console.error(err);
    return Response.error();
  }
}
