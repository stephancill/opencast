# Opencast

A fully open source Twitter flavoured Farcaster client. Originally a fork of [ccrsxx/twitter-clone](https://github.com/ccrsxx/twitter-clone).

The goal of this project is to be a fully standalone Farcaster client that you can run on your own machine. It only depends on [stephancill/lazy-indexer](https://github.com/stephancill/lazy-indexer) and a connection to a Farcaster Hub.

## Running it yourself

### Prerequisites

- [Docker](https://docs.docker.com/engine/install/)

1. Clone the repo

```
git clone git@github.com:stephancill/opencast.git
```

2. Copy .env.sample, rename it to .env and fill in the values

```
cp .env.sample .env
```

3. Run the Docker Compose file

```
docker-compose up -d
```

4. Go to Opencast at http://localhost:3000 and log in. It will take a few moments to index your profile and might require you to refresh the page.

## Development

### Farcaster Indexer

This project depends on the Lazy Farcaster Indexer. Follow the instructions at [https://github.com/stephancill/lazy-indexer](https://github.com/stephancill/lazy-indexer) to set up an instance.

### Local

Install dependencies

```
yarn install
```

Fill in the environment variables

```
cp .env.dev.sample .env
```

Run the development server

```
yarn dev
```

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
  - [x] Casts with replies
  - [ ] Media
  - [x] Likes
  - [ ] Edit profile
- [x] Auth
- [x] Engagement actions
- [x] Post creation
  - [x] Text only
  - [x] Media
  - [x] Mentions
  - [x] Embeds
  - [x] Topic
- [x] Post deletion
- [ ] Search
  - [x] User
  - [ ] Topic
  - [ ] Posts
- [x] Channels (now called Topics)
  - [x] Channel detail
  - [x] Channel discovery
  - [ ] Index channels
- [x] Fix mobile layout
- [ ] Rebrand
  - [x] Renaming (casts -> tweets, etc)
  - [x] Images
  - [ ] Code
- [x] Notifications
  - [x] Badge counter
  - [x] Notifications page
- [ ] Optimize
  - [ ] DB queries
  - [ ] Bandwidth

...
