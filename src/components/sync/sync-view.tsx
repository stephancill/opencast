import useSWR from "swr";

export function SyncView({ userId }: { userId?: string }) {

  const { data, isValidating, error } = useSWR(userId ? `/api/user/${userId}/sync` : undefined, async (url) => {
    const res = await fetch(url)
    return res.json()
  }, {
    refreshInterval: 1000
  })

  return (
    <div>
      {data && !data.done &&
        <div className="flex flex-col gap-2">
          <div>Indexing...</div>
          <div className="flex flex-col">
            <div title="Indexing" className="border rounded-full">
              <div style={{ width: `${Math.round(data.completedCount / data.childCount * 100)}%` }} className={`bg-light-primary dark:bg-dark-primary rounded-full text-right px-2 flex items-center min-w-[20%]`}>
                <div className="text-white dark:text-black ml-auto">
                  {Math.round(data.completedCount / data.childCount * 100)}%
                </div>
              </div>
            </div>
            <div className="dark:text-dark-secondary text-light-secondary">{data.status}</div>
          </div>
        </div>}
    </div>
  );
}
