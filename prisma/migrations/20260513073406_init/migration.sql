-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "avatar" TEXT,
    "smartCategorizationEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Identity" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "replyTo" TEXT,
    "bcc" TEXT,
    "signature" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "userEmail" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Identity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "avatar" TEXT,
    "userEmail" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Folder" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "userEmail" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Folder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Folder_userEmail_name_key" ON "Folder"("userEmail", "name");

-- AddForeignKey
ALTER TABLE "Identity" ADD CONSTRAINT "Identity_userEmail_fkey" FOREIGN KEY ("userEmail") REFERENCES "User"("email") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_userEmail_fkey" FOREIGN KEY ("userEmail") REFERENCES "User"("email") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Folder" ADD CONSTRAINT "Folder_userEmail_fkey" FOREIGN KEY ("userEmail") REFERENCES "User"("email") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "Identity_userEmail_idx" ON "Identity"("userEmail");

-- CreateIndex
CREATE INDEX "Contact_userEmail_idx" ON "Contact"("userEmail");

-- CreateIndex
CREATE INDEX "Folder_userEmail_idx" ON "Folder"("userEmail");

-- Cleanup duplicate defaults: set all but the most recently updated default to false
UPDATE "Identity"
SET "isDefault" = false
WHERE "isDefault" = true
  AND "id" NOT IN (
    SELECT "id" FROM (
      SELECT "id", ROW_NUMBER() OVER(PARTITION BY "userEmail" ORDER BY "updatedAt" DESC) as rn
      FROM "Identity"
      WHERE "isDefault" = true
    ) t
    WHERE t.rn = 1
  );

-- Create partial unique index
CREATE UNIQUE INDEX "Identity_userEmail_default_key" ON "Identity"("userEmail") WHERE "isDefault" = true;
