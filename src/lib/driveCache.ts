import { pool } from './db';

export interface DriveFolderMapping {
  logicalPath: string;
  driveFolderId: string;
  parentFolderId?: string;
}

export async function getCachedDriveFolder(logicalPath: string): Promise<string | null> {
  const result = await pool.query(
    'SELECT drive_folder_id FROM jobs.drive_folders WHERE logical_path = $1 LIMIT 1',
    [logicalPath]
  );
  return result.rows[0]?.drive_folder_id || null;
}

export async function cacheDriveFolder(logicalPath: string, driveFolderId: string, parentFolderId?: string): Promise<void> {
  await pool.query(
    `INSERT INTO jobs.drive_folders (logical_path, drive_folder_id, parent_folder_id, updated_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (logical_path) DO UPDATE SET drive_folder_id = EXCLUDED.drive_folder_id, updated_at = NOW()`,
    [logicalPath, driveFolderId, parentFolderId || null]
  );
}

export function buildJobDrivePath(company: string, role: string, batchId = 'BATCH-000001'): {
  logicalPath: string;
  folderStructure: string[];
} {
  const now = new Date();
  const year = now.getFullYear().toString();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  
  const safeCompany = company.replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeRole = role.replace(/[^a-zA-Z0-9_-]/g, '_');
  
  const logicalPath = `Job Search Assistant/01_Job_Opening/${year}/${month}/${day}/${batchId}/${safeCompany}/${safeRole}`;
  
  return {
    logicalPath,
    folderStructure: ['Job_Data', 'JD', 'Resume', 'Cover_Letter', 'Application', 'Email']
  };
}
