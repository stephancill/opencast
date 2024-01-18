-- CreateTable
CREATE TABLE "Cast" (
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

    CONSTRAINT "Cast_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fid" (
    "fid" BIGINT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "custody_address" BYTEA NOT NULL,

    CONSTRAINT "Fid_pkey" PRIMARY KEY ("fid")
);

-- CreateTable
CREATE TABLE "Link" (
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

    CONSTRAINT "Link_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
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

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reaction" (
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

    CONSTRAINT "Reaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Signer" (
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

    CONSTRAINT "Signer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" BIGSERIAL NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(6),
    "timestamp" TIMESTAMP(6) NOT NULL,
    "fid" BIGINT NOT NULL,
    "hash" BYTEA NOT NULL,
    "type" SMALLINT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Verification" (
    "id" BIGSERIAL NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(6),
    "timestamp" TIMESTAMP(6) NOT NULL,
    "fid" BIGINT NOT NULL,
    "hash" BYTEA NOT NULL,
    "claim" JSONB NOT NULL,

    CONSTRAINT "Verification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Cast_hash_key" ON "Cast"("hash");

-- CreateIndex
CREATE INDEX "cast_fid_timestamp_index" ON "Cast"("fid", "timestamp");

-- CreateIndex
CREATE INDEX "cast_timestamp_index" ON "Cast"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "Link_hash_key" ON "Link"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "Link_fid_target_fid_type_key" ON "Link"("fid", "target_fid", "type");

-- CreateIndex
CREATE UNIQUE INDEX "Message_hash_key" ON "Message"("hash");

-- CreateIndex
CREATE INDEX "messages_timestamp_index" ON "Message"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "Reaction_hash_key" ON "Reaction"("hash");

-- CreateIndex
CREATE INDEX "reaction_fid_timestamp_index" ON "Reaction"("fid", "timestamp");

-- CreateIndex
CREATE INDEX "Signer_fid_timestamp_idx" ON "Signer"("fid", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "User_hash_key" ON "User"("hash");

-- CreateIndex
CREATE INDEX "User_fid_idx" ON "User"("fid");

-- CreateIndex
CREATE UNIQUE INDEX "User_fid_type_key" ON "User"("fid", "type");

-- CreateIndex
CREATE UNIQUE INDEX "Verification_hash_key" ON "Verification"("hash");

-- CreateIndex
CREATE INDEX "verification_fid_timestamp_index" ON "Verification"("fid", "timestamp");

-- AddForeignKey
ALTER TABLE "Cast" ADD CONSTRAINT "cast_hash_foreign" FOREIGN KEY ("hash") REFERENCES "Message"("hash") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Reaction" ADD CONSTRAINT "reaction_hash_foreign" FOREIGN KEY ("hash") REFERENCES "Message"("hash") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "user_hash_foreign" FOREIGN KEY ("hash") REFERENCES "Message"("hash") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Verification" ADD CONSTRAINT "verification_hash_foreign" FOREIGN KEY ("hash") REFERENCES "Message"("hash") ON DELETE NO ACTION ON UPDATE NO ACTION;
