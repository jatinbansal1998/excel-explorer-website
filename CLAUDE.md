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
- **Services Layer**: Business logic in `src/services/` (Excel parsing, data processing, LLM analytics)
- **Utilities**: Pure functions in `src/utils/` (validation, data types, error handling, storage)
- **Type Safety**: Comprehensive TypeScript interfaces in `src/types/`
- **Performance**: Custom hooks for performance monitoring and error handling

### State Management

- React hooks for local component state
- Custom hooks: `useExcelData`, `useFilters`, `useCharts`, `useLLMAnalytics`, `useOpenRouter`, `useSessionPersistence`
- Toast notifications via `ToastProvider` context
- Global property management via `globalProperties` singleton

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
- Web Workers for large dataset processing (>10,000 rows)

## Development Guidelines

### File Processing

- Excel files processed entirely client-side using `xlsx` library
- Support for .xlsx, .xls, and .csv formats
- File validation includes size limits (50MB default) and type checking
- Comprehensive metadata extraction including column statistics
- Progressive loading for large datasets with chunked processing

### Error Handling

- Structured error handling with validation results
- User-friendly error messages via toast system
- Error boundaries prevent application crashes
- File validation before processing
- Abort signal support for long-running operations

### Code Style

- **Prettier**: Semi-colons disabled, single quotes, 100 char width
- **ESLint**: Next.js core web vitals configuration
- **TypeScript**: Strict mode enabled with comprehensive type coverage
- **No Comments Rule**: Do not add code comments unless explicitly requested

## Advanced Features

### AI Integration (OpenRouter)

- **LLM Analytics**: `LLMAnalyticsService` provides AI-powered data analysis
- **Chart Suggestions**: AI suggests appropriate chart types based on data
- **Prompt Templates**: Structured prompts for consistent AI responses
- **Context Building**: Intelligent dataset context building with sampling
- **Error Handling**: Specialized OpenRouter error normalization

### Session Persistence

- **Storage Architecture**: Dual-layer storage (localStorage + IndexedDB)
- **Progressive Loading**: Large datasets loaded with progress tracking
- **Session Management**: Complete session lifecycle (create, restore, delete)
- **Feature Flagging**: Toggle persistence on/off via localStorage
- **Data Compression**: LZ-string compression for efficient storage

### Chart System

- **Chart.js Integration**: Comprehensive charting capabilities
- **Dynamic Suggestions**: AI-powered chart type recommendations
- **Configuration Management**: Flexible chart configuration system
- **Export Functionality**: Chart export in multiple formats
- **Responsive Design**: Charts adapt to container size

### Filtering System

- **Dynamic Filter Generation**: Filters created based on column data types
- **Multi-type Support**: Range, date, select, and search filters
- **Performance Optimized**: Debounced filtering for large datasets
- **State Persistence**: Filter state saved across sessions
- **AI Integration**: AI can apply filter configurations

## Implementation Status

### Completed Features

- ✅ Complete Excel parsing with metadata extraction
- ✅ Dynamic filtering system with multiple filter types
- ✅ Chart visualization with Chart.js integration
- ✅ AI analytics via OpenRouter integration
- ✅ Session persistence with progressive loading
- ✅ Performance monitoring and optimization
- ✅ Error boundaries and graceful failure handling
- ✅ Responsive design with Tailwind CSS

### Advanced Integrations

- ✅ OpenRouter API integration with model selection
- ✅ Encrypted API key storage with passphrase protection
- ✅ LLM-powered data analysis and insights
- ✅ AI-driven chart and filter suggestions
- ✅ Global property management for AI integration
- ✅ Abort signal support for long-running operations

### Architecture Highlights

- **Modular Design**: Clear separation between UI, services, and utilities
- **Type Safety**: Comprehensive TypeScript coverage throughout
- **Performance**: Optimized for large datasets with progressive loading
- **Extensibility**: Plugin-like architecture for filters and charts
- **Testing**: Error boundaries and performance monitoring built-in
