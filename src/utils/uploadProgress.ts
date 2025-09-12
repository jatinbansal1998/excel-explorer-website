import type {UploadProgress} from '@/types/upload'

export function formatProgressMessage(progress?: UploadProgress): string {
    if (!progress) return 'Processing your file...'

    switch (progress.stage) {
        case 'validating':
            return 'Validating file...'
        case 'reading':
            if (progress.percent !== undefined) {
                return `Reading file... ${Math.round(progress.percent)}%`
            }
            return 'Reading file...'
        case 'parsing_workbook':
            return 'Parsing workbook...'
        case 'extracting_headers':
            return 'Extracting headers...'
        case 'building_rows':
            if (progress.percent !== undefined) {
                return `Processing rows... ${Math.round(progress.percent)}%`
            }
            return 'Processing rows...'
        case 'analyzing_columns':
            return 'Analyzing columns...'
        case 'complete':
            return 'Processing complete!'
        default:
            return progress.message || 'Processing your file...'
    }
}

