'use client';

import { trpcClient } from '@lib/trpc';

export default function TestTRPC() {
  const hello = trpcClient.greeting.useQuery({ name: 'Matt' });

  if (!hello.data) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <p>{hello.data.greeting}</p>
    </div>
  );
}
