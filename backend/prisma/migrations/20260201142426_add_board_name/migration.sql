-- DropForeignKey
ALTER TABLE "Stroke" DROP CONSTRAINT "Stroke_userId_fkey";

-- AlterTable
ALTER TABLE "Board" ADD COLUMN     "name" TEXT NOT NULL DEFAULT 'Untitled Board',
ALTER COLUMN "ownerId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Stroke" ADD COLUMN     "text" TEXT;

-- CreateTable
CREATE TABLE "RecentBoard" (
    "userId" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "visitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecentBoard_pkey" PRIMARY KEY ("userId","boardId")
);

-- AddForeignKey
ALTER TABLE "RecentBoard" ADD CONSTRAINT "RecentBoard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecentBoard" ADD CONSTRAINT "RecentBoard_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE CASCADE ON UPDATE CASCADE;
