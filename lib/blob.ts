import { put, del, list, head } from '@vercel/blob';

if (!process.env.BLOB_READ_WRITE_TOKEN) {
  throw new Error('Missing BLOB_READ_WRITE_TOKEN environment variable');
}

// File upload configuration
export const UPLOAD_CONFIG = {
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '52428800'), // 50MB default
  allowedTypes: (process.env.ALLOWED_FILE_TYPES || 'application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain').split(','),
  maxFilesPerUser: parseInt(process.env.MAX_FILES_PER_USER || '1000'),
};

// Upload a contract file
export async function uploadContractFile(
  file: File | Buffer,
  filename: string,
  userId: string,
  contractId: string
): Promise<{ url: string; pathname: string }> {
  try {
    // Create a unique path for the file
    const timestamp = Date.now();
    const pathname = `contracts/${userId}/${contractId}/${timestamp}-${filename}`;
    
    const blob = await put(pathname, file, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    
    return {
      url: blob.url,
      pathname: blob.pathname,
    };
  } catch (error) {
    console.error('Error uploading file to Vercel Blob:', error);
    throw new Error('Failed to upload file');
  }
}

// Upload user avatar
export async function uploadUserAvatar(
  file: File | Buffer,
  filename: string,
  userId: string
): Promise<{ url: string; pathname: string }> {
  try {
    const timestamp = Date.now();
    const pathname = `avatars/${userId}/${timestamp}-${filename}`;
    
    const blob = await put(pathname, file, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    
    return {
      url: blob.url,
      pathname: blob.pathname,
    };
  } catch (error) {
    console.error('Error uploading avatar to Vercel Blob:', error);
    throw new Error('Failed to upload avatar');
  }
}

// Upload exported report
export async function uploadExportedReport(
  content: Buffer,
  filename: string,
  userId: string,
  analysisId: string
): Promise<{ url: string; pathname: string; expiresAt: Date }> {
  try {
    const timestamp = Date.now();
    const pathname = `exports/${userId}/${analysisId}/${timestamp}-${filename}`;
    
    const blob = await put(pathname, content, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    
    // Set expiration to 7 days from now
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    return {
      url: blob.url,
      pathname: blob.pathname,
      expiresAt,
    };
  } catch (error) {
    console.error('Error uploading exported report to Vercel Blob:', error);
    throw new Error('Failed to upload exported report');
  }
}

// Delete a file
export async function deleteFile(pathname: string): Promise<void> {
  try {
    await del(pathname, {
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
  } catch (error) {
    console.error('Error deleting file from Vercel Blob:', error);
    throw new Error('Failed to delete file');
  }
}

// List files for a user
export async function listUserFiles(
  userId: string,
  prefix?: string
): Promise<Array<{ url: string; pathname: string; size: number; uploadedAt: Date }>> {
  try {
    const searchPrefix = prefix ? `${prefix}/${userId}` : `contracts/${userId}`;
    
    const { blobs } = await list({
      prefix: searchPrefix,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    
    return blobs.map(blob => ({
      url: blob.url,
      pathname: blob.pathname,
      size: blob.size,
      uploadedAt: blob.uploadedAt,
    }));
  } catch (error) {
    console.error('Error listing user files from Vercel Blob:', error);
    throw new Error('Failed to list user files');
  }
}

// Get file metadata
export async function getFileMetadata(pathname: string): Promise<{
  url: string;
  size: number;
  uploadedAt: Date;
  contentType?: string;
} | null> {
  try {
    const blob = await head(pathname, {
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    
    return {
      url: blob.url,
      size: blob.size,
      uploadedAt: blob.uploadedAt,
      contentType: blob.contentType,
    };
  } catch (error) {
    console.error('Error getting file metadata from Vercel Blob:', error);
    return null;
  }
}

// Validate file type
export function validateFileType(filename: string, mimeType?: string): boolean {
  const extension = filename.toLowerCase().split('.').pop();
  const allowedExtensions = ['pdf', 'docx', 'txt'];
  
  if (!extension || !allowedExtensions.includes(extension)) {
    return false;
  }
  
  if (mimeType && !UPLOAD_CONFIG.allowedTypes.includes(mimeType)) {
    return false;
  }
  
  return true;
}

// Validate file size
export function validateFileSize(size: number): boolean {
  return size <= UPLOAD_CONFIG.maxFileSize;
}

// Clean up expired files (should be run as a cron job)
export async function cleanupExpiredFiles(): Promise<void> {
  try {
    const { blobs } = await list({
      prefix: 'exports/',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    
    const now = new Date();
    const expiredFiles = blobs.filter(blob => {
      // Files in exports folder expire after 7 days
      const expirationDate = new Date(blob.uploadedAt.getTime() + 7 * 24 * 60 * 60 * 1000);
      return now > expirationDate;
    });
    
    for (const file of expiredFiles) {
      await deleteFile(file.pathname);
      console.log(`Deleted expired file: ${file.pathname}`);
    }
    
    console.log(`Cleaned up ${expiredFiles.length} expired files`);
  } catch (error) {
    console.error('Error cleaning up expired files:', error);
  }
}

// Get storage usage for a user
export async function getUserStorageUsage(userId: string): Promise<{
  totalFiles: number;
  totalSize: number;
  contractFiles: number;
  contractSize: number;
  exportFiles: number;
  exportSize: number;
}> {
  try {
    const [contractFiles, exportFiles] = await Promise.all([
      listUserFiles(userId, 'contracts'),
      listUserFiles(userId, 'exports'),
    ]);
    
    const contractSize = contractFiles.reduce((total, file) => total + file.size, 0);
    const exportSize = exportFiles.reduce((total, file) => total + file.size, 0);
    
    return {
      totalFiles: contractFiles.length + exportFiles.length,
      totalSize: contractSize + exportSize,
      contractFiles: contractFiles.length,
      contractSize,
      exportFiles: exportFiles.length,
      exportSize,
    };
  } catch (error) {
    console.error('Error getting user storage usage:', error);
    return {
      totalFiles: 0,
      totalSize: 0,
      contractFiles: 0,
      contractSize: 0,
      exportFiles: 0,
      exportSize: 0,
    };
  }
}