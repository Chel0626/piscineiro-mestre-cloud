import { onSchedule } from "firebase-functions/v2/scheduler";
import { getStorage } from "firebase-admin/storage";
import { logger } from "firebase-functions";

export const cleanupTempReports = onSchedule("every 24 hours", async (event) => {
  try {
    const bucket = getStorage().bucket();
    // Lista arquivos na pasta temp_reports
    const [files] = await bucket.getFiles({ prefix: "temp_reports/" });
    
    const now = Date.now();
    const ONE_DAY = 24 * 60 * 60 * 1000;
    let deletedCount = 0;

    const deletePromises = files.map(async (file) => {
      const [metadata] = await file.getMetadata();
      // timeCreated vem como string no metadata
      const timeCreated = new Date(metadata.timeCreated!).getTime();
      
      if (now - timeCreated > ONE_DAY) {
        await file.delete();
        deletedCount++;
      }
    });

    await Promise.all(deletePromises);
    logger.info(`Cleanup completed. Deleted ${deletedCount} files.`);
  } catch (error) {
    logger.error("Error cleaning up temp reports:", error);
  }
});
