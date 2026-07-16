-- AlterTable
ALTER TABLE "users" ADD COLUMN     "preferred_module_id" UUID;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_preferred_module_id_fkey" FOREIGN KEY ("preferred_module_id") REFERENCES "modules"("id") ON DELETE SET NULL ON UPDATE CASCADE;
