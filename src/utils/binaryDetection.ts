
export interface BinaryDetectionResult {
  isBinary: boolean;
  mimeType?: string;
  fileExtension?: string;
  fileName?: string;
  size?: number;
  warning?: string;
}

export const detectBinaryContent = (content: string, url?: string): BinaryDetectionResult => {
  // Check if content is base64 encoded binary
  if (content.startsWith('data:application/octet-stream;base64,')) {
    return {
      isBinary: true,
      mimeType: 'application/octet-stream',
      fileExtension: extractFileExtension(url),
      fileName: extractFileName(url),
      size: estimateBase64Size(content),
      warning: 'This is a binary file, not a script'
    };
  }

  // Check for Windows executable magic bytes (MZ header)
  if (content.startsWith('MZ') || content.charCodeAt(0) === 77 && content.charCodeAt(1) === 90) {
    return {
      isBinary: true,
      mimeType: 'application/x-msdownload',
      fileExtension: '.exe',
      fileName: extractFileName(url),
      warning: 'This is a Windows executable file'
    };
  }

  // Check for other binary indicators
  const binaryIndicators = [
    { pattern: /^PK/, mimeType: 'application/zip', extension: '.zip' },
    { pattern: /^Rar!/, mimeType: 'application/x-rar-compressed', extension: '.rar' },
    { pattern: /^\x7fELF/, mimeType: 'application/x-executable', extension: '.bin' },
    { pattern: /^%PDF/, mimeType: 'application/pdf', extension: '.pdf' },
  ];

  for (const indicator of binaryIndicators) {
    if (indicator.pattern.test(content)) {
      return {
        isBinary: true,
        mimeType: indicator.mimeType,
        fileExtension: indicator.extension,
        fileName: extractFileName(url),
        warning: `This is a ${indicator.extension} file, not a script`
      };
    }
  }

  // Check for high percentage of non-printable characters
  const nonPrintableCount = content.split('').filter(char => {
    const code = char.charCodeAt(0);
    return code < 32 && code !== 9 && code !== 10 && code !== 13; // Exclude tab, LF, CR
  }).length;

  const nonPrintableRatio = nonPrintableCount / content.length;
  
  if (nonPrintableRatio > 0.3 && content.length > 100) {
    return {
      isBinary: true,
      mimeType: 'application/octet-stream',
      fileExtension: extractFileExtension(url),
      fileName: extractFileName(url),
      warning: 'This appears to be a binary file based on content analysis'
    };
  }

  return { isBinary: false };
};

const extractFileName = (url?: string): string | undefined => {
  if (!url) return undefined;
  
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const fileName = pathname.split('/').pop();
    return fileName && fileName !== '' ? fileName : undefined;
  } catch {
    return undefined;
  }
};

const extractFileExtension = (url?: string): string | undefined => {
  const fileName = extractFileName(url);
  if (!fileName) return undefined;
  
  const lastDot = fileName.lastIndexOf('.');
  return lastDot !== -1 ? fileName.substring(lastDot) : undefined;
};

const estimateBase64Size = (base64Content: string): number => {
  // Remove data URL prefix if present
  const base64Data = base64Content.replace(/^data:[^;]+;base64,/, '');
  // Base64 encoding increases size by ~33%, so decode size is ~75% of encoded
  return Math.round((base64Data.length * 3) / 4);
};

export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};
