# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Essential Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run export` - Static export (outputs to `out/`)
- `npm run lint` - Run ESLint
- `npm run type-check` - TypeScript type checking

### Quality Assurance
Before committing changes, run:
1. `npm run type-check` - Ensure TypeScript compliance
2. `npm run lint` - Check code style and catch issues

## Project Architecture

### Core Data Flow
1. **File Upload**: `FileUploader` component handles drag/drop and file selection
2. **Excel Processing**: `ExcelParser` service (in `src/services/excelParser.ts`) processes Excel/CSV files using `xlsx` library
3. **Data Structure**: Parsed data follows `ExcelData` interface with headers, rows, and rich metadata
4. **Display**: `DataTable` component renders data with virtualization for performance

### Key Data Models
- **ExcelData**: Main data structure containing headers, rows, and metadata
- **ColumnInfo**: Rich column metadata including data types, statistics, and unique values  
- **DataType**: Supports 'string' | 'number' | 'date' | 'boolean' | 'mixed'

### Architecture Patterns
- **Component Structure**: UI components in `src/components/`, with `ui/` subfolder for reusable elements
- **Services Layer**: Business logic in `src/services/` (Excel parsing, data processing)
- **Utilities**: Pure functions in `src/utils/` (validation, data types, error handling)
- **Type Safety**: Comprehensive TypeScript interfaces in `src/types/`
- **Performance**: Custom hooks for performance monitoring and error handling

### State Management
- React hooks for local component state
- Custom hooks: `useExcelData`, `useErrorHandler`, `usePerformance`
- Toast notifications via `ToastProvider` context

## Technical Configuration

### Next.js Setup
- **Static Export**: Configured with `output: 'export'` for static hosting
- **App Router**: Uses Next.js 14 App Router (not Pages Router)
- **Path Aliases**: `@/*` maps to `src/*`

### Styling
- **Tailwind CSS**: Primary styling system with custom color palette
- **Custom Colors**: Primary color palette (blue shades: 50, 300, 500, 600, 700)
- **Component Styling**: Uses `clsx` for conditional classes

### Browser Compatibility
- File API for client-side Excel processing
- Dynamic imports to avoid SSR issues with `xlsx` library
- Browser compatibility utilities in `src/utils/browserCompatibility.ts`

### Performance Considerations
- Virtual scrolling for large datasets via `react-window`
- Debounced operations with `lodash.debounce`
- Performance monitoring utilities
- Error boundaries for graceful failure handling

## Development Guidelines

### File Processing
- Excel files processed entirely client-side using `xlsx` library
- Support for .xlsx, .xls, and .csv formats
- File validation includes size limits (50MB default) and type checking
- Comprehensive metadata extraction including column statistics

### Error Handling
- Structured error handling with validation results
- User-friendly error messages via toast system
- Error boundaries prevent application crashes
- File validation before processing

### Code Style
- **Prettier**: Semi-colons disabled, single quotes, 100 char width
- **ESLint**: Next.js core web vitals configuration
- **TypeScript**: Strict mode enabled with comprehensive type coverage
- **No Comments Rule**: Do not add code comments unless explicitly requested

## Team Development Context

This is a multi-team project with placeholder components:
- **FilterPanel**: Planned for implementation by Filter team (Plan 04)
- **ChartView**: Planned for implementation by Chart team (Plan 05)
- **Data Processing**: Core Excel parsing implemented, mock data used in development

The application currently shows mock data for UI development while core data processing infrastructure is complete and ready for integration.