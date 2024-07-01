import type { NextApiRequest, NextApiResponse } from 'next';
import { UserFull, UserResponse } from '../../../../lib/types/user';

type UserEndpointQuery = {
  id: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UserResponse>
): Promise<void> {
  const { id } = req.query as UserEndpointQuery;

  const syncProgressRes = await fetch(
    `${process.env.INDEXER_API_URL!}/root-backfill/${id}`
  );

  if (!syncProgressRes.ok) {
    const json = await syncProgressRes.json();
    res.status(syncProgressRes.status).json(json);
    return;
  }

  const syncProgress = await syncProgressRes.json();

  res.status(200).json(syncProgress);
}
