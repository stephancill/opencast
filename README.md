## Development 💻

### Farcaster Replicator

This project depends on the Farcaster PosgreSQL database. Follow the instructions at https://github.com/farcasterxyz/hub-monorepo/tree/main/packages/hub-nodejs/examples/replicate-data-postgres to set up an instance.

### Local

1. `yarn`

1. Copy the `.env.sample` file to `.env` and fill in the database connection details.

1. `yarn dev`

## Preview 🎬

https://user-images.githubusercontent.com/55032197/201472767-9db0177a-79b5-4913-8666-1744102b0ad7.mp4

## Todo

- [ ] Feed
  - [x] Reverse chronological feed
  - [x] Pagination
  - [ ] Number of likes, comments, and reposts
- [ ] Cast detail
  - [ ] Number of likes, comments, and reposts
  - [ ] Paginated replies
- [ ] User profiles
- [ ] Engagement actions
- [ ] Post creation
- [ ] Post deletion
- [ ] Channels (may require modification of the Postgres replication)

...

## Tech 🛠

- [Next.js](https://nextjs.org)
- [TypeScript](https://www.typescriptlang.org)
- [Tailwind CSS](https://tailwindcss.com)
- [Firebase](https://firebase.google.com)
- [SWR](https://swr.vercel.app)
- [Headless UI](https://headlessui.com)
- [React Hot Toast](https://react-hot-toast.com)
- [Framer Motion](https://framer.com)
