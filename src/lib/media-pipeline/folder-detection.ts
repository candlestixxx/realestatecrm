import fs from 'fs';
import path from 'path';

export class FolderDetectionService {
  private static defaultPaths: string[] = [
    process.env.LISTING_SHARE_PATH || '\\\\excelserver\\WeichertShare\\1 LISTINGS\\2026 Listings',
    path.join(process.env.HOME || process.env.USERPROFILE || '', 'MLS'),
    path.join(process.env.HOME || process.env.USERPROFILE || '', 'Downloads'),
    path.join(process.env.HOME || process.env.USERPROFILE || '', 'Desktop')
  ];

  public static findPropertyFolder(address: string, overridePaths?: string[]): string | null {
    const pathsToSearch = overridePaths || this.defaultPaths;

    for (const searchPath of pathsToSearch) {
      if (!searchPath) continue;

      try {
        const expectedFolderPath = path.join(searchPath, address);

        if (fs.existsSync(expectedFolderPath)) {
          const stats = fs.statSync(expectedFolderPath);
          if (stats.isDirectory()) {
            return expectedFolderPath;
          }
        }
      } catch (error) {
        continue;
      }
    }

    return null;
  }
}
