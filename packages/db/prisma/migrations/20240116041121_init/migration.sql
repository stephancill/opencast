-- CreateTable
CREATE TABLE "casts" (
    "id" BIGSERIAL NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(6),
    "timestamp" TIMESTAMP(6) NOT NULL,
    "fid" BIGINT NOT NULL,
    "hash" BYTEA NOT NULL,
    "parent_hash" BYTEA,
    "parent_fid" BIGINT,
    "parent_url" TEXT,
    "text" TEXT NOT NULL,
    "embeds" JSONB NOT NULL DEFAULT '{}',
    "mentions" BIGINT[] DEFAULT ARRAY[]::BIGINT[],
    "mentions_positions" SMALLINT[] DEFAULT ARRAY[]::SMALLINT[],

    CONSTRAINT "casts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fids" (
    "fid" BIGINT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "custody_address" BYTEA NOT NULL,

    CONSTRAINT "fids_pkey" PRIMARY KEY ("fid")
);

-- CreateTable
CREATE TABLE "fnames" (
    "fname" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "custody_address" BYTEA,
    "expires_at" TIMESTAMP(6),
    "fid" BIGINT,
    "deleted_at" TIMESTAMP(6),

    CONSTRAINT "fnames_pkey" PRIMARY KEY ("fname")
);

-- CreateTable
CREATE TABLE "hub_subscriptions" (
    "host" TEXT NOT NULL,
    "last_event_id" BIGINT,

    CONSTRAINT "hub_subscriptions_pkey" PRIMARY KEY ("host")
);

-- CreateTable
CREATE TABLE "kysely_migration" (
    "name" VARCHAR(255) NOT NULL,
    "timestamp" VARCHAR(255) NOT NULL,

    CONSTRAINT "kysely_migration_pkey" PRIMARY KEY ("name")
);

-- CreateTable
CREATE TABLE "kysely_migration_lock" (
    "id" VARCHAR(255) NOT NULL,
    "is_locked" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "kysely_migration_lock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "links" (
    "id" BIGSERIAL NOT NULL,
    "fid" BIGINT,
    "target_fid" BIGINT,
    "hash" BYTEA NOT NULL,
    "timestamp" TIMESTAMP(6) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(6),
    "type" TEXT,
    "display_timestamp" TIMESTAMP(6),

    CONSTRAINT "links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" BIGSERIAL NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(6),
    "pruned_at" TIMESTAMP(6),
    "revoked_at" TIMESTAMP(6),
    "timestamp" TIMESTAMP(6) NOT NULL,
    "message_type" SMALLINT NOT NULL,
    "fid" BIGINT NOT NULL,
    "hash" BYTEA NOT NULL,
    "hash_scheme" SMALLINT NOT NULL,
    "signature" BYTEA NOT NULL,
    "signature_scheme" SMALLINT NOT NULL,
    "signer" BYTEA NOT NULL,
    "raw" BYTEA NOT NULL,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reactions" (
    "id" BIGSERIAL NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(6),
    "timestamp" TIMESTAMP(6) NOT NULL,
    "reaction_type" SMALLINT NOT NULL,
    "fid" BIGINT NOT NULL,
    "hash" BYTEA NOT NULL,
    "target_hash" BYTEA,
    "target_fid" BIGINT,
    "target_url" TEXT,

    CONSTRAINT "reactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "signers" (
    "id" BIGSERIAL NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(6),
    "timestamp" TIMESTAMP(6) NOT NULL,
    "fid" BIGINT NOT NULL,
    "hash" BYTEA,
    "custody_address" BYTEA,
    "signer" BYTEA NOT NULL,
    "name" TEXT,

    CONSTRAINT "signers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_data" (
    "id" BIGSERIAL NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(6),
    "timestamp" TIMESTAMP(6) NOT NULL,
    "fid" BIGINT NOT NULL,
    "hash" BYTEA NOT NULL,
    "type" SMALLINT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "user_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verifications" (
    "id" BIGSERIAL NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(6),
    "timestamp" TIMESTAMP(6) NOT NULL,
    "fid" BIGINT NOT NULL,
    "hash" BYTEA NOT NULL,
    "claim" JSONB NOT NULL,

    CONSTRAINT "verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "storage" (
    "id" BIGSERIAL NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(6),
    "timestamp" TIMESTAMP(6) NOT NULL,
    "fid" BIGINT NOT NULL,
    "units" BIGINT NOT NULL,
    "expiry" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "storage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "casts_hash_unique" ON "casts"("hash");

-- CreateIndex
CREATE INDEX "casts_fid_timestamp_index" ON "casts"("fid", "timestamp");

-- CreateIndex
CREATE INDEX "casts_timestamp_index" ON "casts"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "links_hash_unique" ON "links"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "links_fid_target_fid_type_unique" ON "links"("fid", "target_fid", "type");

-- CreateIndex
CREATE UNIQUE INDEX "messages_hash_unique" ON "messages"("hash");

-- CreateIndex
CREATE INDEX "messages_timestamp_index" ON "messages"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "reactions_hash_unique" ON "reactions"("hash");

-- CreateIndex
CREATE INDEX "reactions_fid_timestamp_index" ON "reactions"("fid", "timestamp");

-- CreateIndex
CREATE INDEX "signers_fid_timestamp_index" ON "signers"("fid", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "user_data_hash_unique" ON "user_data"("hash");

-- CreateIndex
CREATE INDEX "user_data_fid_index" ON "user_data"("fid");

-- CreateIndex
CREATE UNIQUE INDEX "user_data_fid_type_unique" ON "user_data"("fid", "type");

-- CreateIndex
CREATE UNIQUE INDEX "verifications_hash_unique" ON "verifications"("hash");

-- CreateIndex
CREATE INDEX "verifications_fid_timestamp_index" ON "verifications"("fid", "timestamp");

-- AddForeignKey
ALTER TABLE "casts" ADD CONSTRAINT "casts_hash_foreign" FOREIGN KEY ("hash") REFERENCES "messages"("hash") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "reactions" ADD CONSTRAINT "reactions_hash_foreign" FOREIGN KEY ("hash") REFERENCES "messages"("hash") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_data" ADD CONSTRAINT "user_data_hash_foreign" FOREIGN KEY ("hash") REFERENCES "messages"("hash") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "verifications" ADD CONSTRAINT "verifications_hash_foreign" FOREIGN KEY ("hash") REFERENCES "messages"("hash") ON DELETE NO ACTION ON UPDATE NO ACTION;
