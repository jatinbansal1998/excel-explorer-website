export interface FileValidationOptions {
  maxSizeMB?: number; // default 50MB
  allowedTypes?: string[]; // MIME types or extensions
}

export interface FileValidationResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
}

const DEFAULT_ALLOWED_EXTS = ['.xlsx', '.xls', '.csv'];

export function validateFile(file: File, options: FileValidationOptions = {}): FileValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const { maxSizeMB = 50, allowedTypes } = options;
  const allowed = allowedTypes && allowedTypes.length > 0 ? allowedTypes : DEFAULT_ALLOWED_EXTS;

  const name = file.name.toLowerCase();
  const hasAllowedExt = allowed.some((ext) => name.endsWith(ext));
  if (!hasAllowedExt) {
    errors.push(`Unsupported file type: ${file.name}. Allowed: ${allowed.join(', ')}`);
  }

  const sizeMB = file.size / (1024 * 1024);
  if (sizeMB > maxSizeMB) {
    errors.push(`File is too large (${sizeMB.toFixed(1)}MB). Max allowed is ${maxSizeMB}MB.`);
  } else if (sizeMB > Math.max(10, maxSizeMB * 0.5)) {
    warnings.push(`Large file detected (${sizeMB.toFixed(1)}MB). Processing may take longer.`);
  }

  return { ok: errors.length === 0, errors, warnings };
}
