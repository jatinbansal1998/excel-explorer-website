export type UploadProgressStage =
  | 'validating'
  | 'reading'
  | 'parsing_workbook'
  | 'extracting_headers'
  | 'building_rows'
  | 'analyzing_columns'
  | 'complete'

export interface UploadProgress {
  stage: UploadProgressStage
  message?: string
  percent?: number
  loaded?: number
  total?: number
}

export interface FileUploaderBaseProps {
  acceptedTypes?: string[]
  maxSize?: number // in bytes
  className?: string
}
