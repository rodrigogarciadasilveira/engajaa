-- AlterTable
ALTER TABLE "IgPost" ADD COLUMN     "mediaUrl" TEXT,
ADD COLUMN     "permalink" TEXT,
ADD COLUMN     "sharesCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "thumbnailUrl" TEXT;

-- AlterTable
ALTER TABLE "InstagramAccount" ADD COLUMN     "biography" TEXT,
ADD COLUMN     "followersCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "mediaCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "profilePictureUrl" TEXT;
