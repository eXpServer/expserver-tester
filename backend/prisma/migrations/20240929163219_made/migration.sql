/*
  Warnings:

  - A unique constraint covering the columns `[stageNo]` on the table `File` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "File_stageNo_key" ON "File"("stageNo");
