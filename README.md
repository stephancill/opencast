# Opencast

A fully open source Twitter flavoured Farcaster client. Originally a fork of [ccrsxx/twitter-clone](https://github.com/ccrsxx/twitter-clone).

The goal of this project is to provide a reference implementation of a Farcaster client in order to make it easier for developers to explore their ideas without having to start from scratch.

It only depends on the reference Farcaster postgres indexer and optionally a hub for submitting messages.

## Development 💻

### Farcaster Replicator

This project depends on the reference Farcaster PosgreSQL indexer. Follow the instructions at [replicate-data-postgres](https://github.com/farcasterxyz/hub-monorepo/tree/main/packages/hub-nodejs/examples/replicate-data-postgres) to set up an instance.

### Local

1. `yarn`

1. Copy the `.env.sample` file to `.env` and fill in the database connection details.

1. `yarn dev`

## Todo

- [ ] Feed
  - [x] Reverse chronological feed
  - [x] Pagination
  - [x] Number of likes, comments, and reposts
  - [ ] Recasts
- [x] Cast detail
  - [x] Number of likes, comments, and reposts
  - [x] Paginated replies
- [x] User profiles
  - [x] Casts
  - [ ] Casts with replies
  - [ ] Media
  - [ ] Likes
- [x] Auth
- [x] Engagement actions
- [ ] Post creation
  - [x] Text only
  - [x] Media
  - [ ] Mentions
  - [ ] Embeds
- [x] Post deletion
- [ ] Search
- [x] Channels (now called Topics)
  - [x] Channel detail
  - [x] Channel discovery
  - [ ] Index channels
- [x] Fix mobile layout
- [ ] Rebrand
- [ ] Optimize
  - [ ] DB queries

...

## Tech 🛠

- [Next.js](https://nextjs.org)
- [TypeScript](https://www.typescriptlang.org)
- [Tailwind CSS](https://tailwindcss.com)
- [SWR](https://swr.vercel.app)
- [Headless UI](https://headlessui.com)
- [React Hot Toast](https://react-hot-toast.com)
- [Framer Motion](https://framer.com)
