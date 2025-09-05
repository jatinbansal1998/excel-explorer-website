# Plan 03: UI Components & Layout

## Engineer Assignment
**Primary Engineer**: Frontend/UI Engineer
**Dependencies**: Plan 01 (Infrastructure) must be completed first
**Estimated Time**: 3-4 days
**Can work in parallel with**: Plans 02, 04, 05, 06

## Overview
Create all user interface components, layout structure, and interactive elements. Focus on responsive design, accessibility, and user experience.

## Deliverables

### 1. Core Layout Components
- [ ] Main application layout with sidebar/header
- [ ] Responsive grid system
- [ ] Navigation structure
- [ ] Loading states and error boundaries

### 2. File Upload Interface
- [ ] Drag & drop file upload component
- [ ] File selection button alternative
- [ ] Upload progress indicators
- [ ] File validation feedback UI

### 3. Data Display Components
- [ ] Virtual scrolling data table
- [ ] Column headers with sorting
- [ ] Cell rendering with type-specific formatting
- [ ] Pagination controls
- [ ] Empty state and loading placeholders

### 4. UI Kit Components
- [ ] Reusable button components
- [ ] Modal dialog system
- [ ] Loading spinners and progress bars
- [ ] Toast notification system
- [ ] Form input components

## Dependencies to Install
```json
{
  "@headlessui/react": "^1.7.17",
  "@heroicons/react": "^2.0.18",
  "clsx": "^2.0.0",
  "react-window": "^1.8.8",
  "@types/react-window": "^1.8.8"
}
```

## Component Architecture

### Layout Structure (src/app/layout.tsx)
```typescript
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <main className="container mx-auto px-4 py-8">
            {children}
          </main>
          <ToastContainer />
        </div>
      </body>
    </html>
  )
}
```

### Main Page Structure (src/app/page.tsx)
```typescript
export default function HomePage() {
  return (
    <div className="space-y-6">
      <FileUploader />
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <FilterPanel />
        </div>
        <div className="lg:col-span-3 space-y-6">
          <DataTable />
          <ChartView />
        </div>
      </div>
    </div>
  )
}
```

## Components to Implement

### 1. File Upload (src/components/FileUploader.tsx)
```typescript
interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  isLoading?: boolean;
  acceptedTypes?: string[];
  maxSize?: number;
}

export function FileUploader({ 
  onFileSelect, 
  isLoading, 
  acceptedTypes,
  maxSize 
}: FileUploaderProps) {
  // Drag & drop functionality
  // File validation
  // Progress indication
  // Error handling UI
}
```

### 2. Data Table (src/components/DataTable.tsx)
```typescript
interface DataTableProps {
  data: ExcelData;
  filteredRows: any[][];
  onSort: (column: string, direction: 'asc' | 'desc') => void;
  isLoading?: boolean;
}

export function DataTable({ 
  data, 
  filteredRows, 
  onSort, 
  isLoading 
}: DataTableProps) {
  // Virtual scrolling implementation
  // Column sorting
  // Responsive design
  // Cell formatting
}
```

### 3. UI Kit Components (src/components/ui/)

#### Button Component
```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}
```

#### Modal Component
```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}
```

#### Loading Spinner
```typescript
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}
```

## Styling Guidelines

### Tailwind Configuration
```javascript
// tailwind.config.js additions
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        }
      }
    },
  },
}
```

### Design System
```typescript
// Color palette
- Primary: Blue (data focus)
- Success: Green (file upload, operations)
- Warning: Amber (validation, limits)
- Error: Red (errors, validation failures)
- Neutral: Gray scale (text, backgrounds)

// Typography
- Headings: Inter font family
- Body: Inter font family
- Code/Data: Mono font family

// Spacing
- Consistent 4px grid system
- Component spacing: 1rem (16px)
- Section spacing: 1.5rem (24px)
```

## Responsive Design Requirements
- [ ] Mobile-first approach
- [ ] Tablet layout (768px+)
- [ ] Desktop layout (1024px+)
- [ ] Large screen optimization (1536px+)

### Breakpoint Strategy
```css
/* Mobile: Default styles */
/* Tablet: md:* (768px+) */
.grid-cols-1 md:grid-cols-2

/* Desktop: lg:* (1024px+) */
.lg:grid-cols-4

/* Large: xl:* (1280px+) */
.xl:max-w-7xl
```

## Accessibility Requirements
- [ ] ARIA labels for interactive elements
- [ ] Keyboard navigation support
- [ ] Focus management in modals
- [ ] Screen reader compatibility
- [ ] Color contrast compliance (WCAG AA)
- [ ] Alternative text for visual elements

## Component Testing Strategy
- [ ] Storybook setup for component development
- [ ] Unit tests with React Testing Library
- [ ] Visual regression testing
- [ ] Accessibility testing with axe

## Files to Create
- [ ] `src/components/FileUploader.tsx`
- [ ] `src/components/DataTable.tsx`
- [ ] `src/components/ui/Button.tsx`
- [ ] `src/components/ui/Modal.tsx`
- [ ] `src/components/ui/LoadingSpinner.tsx`
- [ ] `src/components/ui/Toast.tsx`
- [ ] `src/app/layout.tsx` (enhance from infrastructure)
- [ ] `src/app/page.tsx` (main page layout)
- [ ] `src/app/globals.css` (global styles)

## Integration Interfaces

### Props from Data Team (Plan 02)
```typescript
// Data will be provided via these interfaces
interface DataProps {
  excelData: ExcelData | null;
  isLoading: boolean;
  error: string | null;
}
```

### Props for Filter Team (Plan 04)
```typescript
// UI will expose these callbacks
interface FilterCallbacks {
  onFilterChange: (filters: FilterConfig[]) => void;
  onFilterReset: () => void;
}
```

### Props for Chart Team (Plan 05)
```typescript
// UI will provide chart container and controls
interface ChartContainerProps {
  data: any[];
  chartConfig: ChartConfig;
  onConfigChange: (config: ChartConfig) => void;
}
```

## Performance Considerations
- [ ] Virtual scrolling for large datasets
- [ ] Lazy loading for off-screen components
- [ ] Debounced user interactions
- [ ] Optimized re-renders with React.memo
- [ ] Efficient CSS with Tailwind purging

## Validation Criteria
- [ ] All components render without errors
- [ ] Responsive design works across breakpoints
- [ ] Accessibility audit passes
- [ ] Performance metrics acceptable (Lighthouse 90+)
- [ ] Visual design matches requirements
- [ ] Component API contracts defined for other teams

## Notes for Integration Teams
- **Data Team**: Component props clearly defined - pass data via established interfaces
- **Filter Team**: FilterPanel component slot reserved - implement your logic there
- **Chart Team**: ChartView component slot reserved - integrate your charts there
- **Utils Team**: Toast system available for notifications, error handling patterns established