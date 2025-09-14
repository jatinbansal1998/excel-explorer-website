[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=jatinbansal1998_excel-explorer-website&metric=alert_status&token=5caf65f17e5cf934c17c7c2735d5b426ce04baa6)](https://sonarcloud.io/summary/new_code?id=jatinbansal1998_excel-explorer-website)
[![Bugs](https://sonarcloud.io/api/project_badges/measure?project=jatinbansal1998_excel-explorer-website&metric=bugs&token=5caf65f17e5cf934c17c7c2735d5b426ce04baa6)](https://sonarcloud.io/summary/new_code?id=jatinbansal1998_excel-explorer-website)
[![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=jatinbansal1998_excel-explorer-website&metric=code_smells&token=5caf65f17e5cf934c17c7c2735d5b426ce04baa6)](https://sonarcloud.io/summary/new_code?id=jatinbansal1998_excel-explorer-website)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=jatinbansal1998_excel-explorer-website&metric=coverage&token=5caf65f17e5cf934c17c7c2735d5b426ce04baa6)](https://sonarcloud.io/summary/new_code?id=jatinbansal1998_excel-explorer-website)
[![Duplicated Lines (%)](https://sonarcloud.io/api/project_badges/measure?project=jatinbansal1998_excel-explorer-website&metric=duplicated_lines_density&token=5caf65f17e5cf934c17c7c2735d5b426ce04baa6)](https://sonarcloud.io/summary/new_code?id=jatinbansal1998_excel-explorer-website)

# Excel Explorer Website

A powerful web application for exploring, analyzing, and visualizing Excel data with advanced filtering, charting, and AI-powered analytics capabilities.

## Features

- **Excel File Upload & Parsing**: Upload and parse Excel files with robust data validation
- **Interactive Data Table**: View and explore your data in a responsive, sortable table
- **Advanced Filtering System**: Filter data by date ranges, numeric ranges, search terms, and custom selections
- **Dynamic Chart Creation**: Create various types of charts from your data with customizable configurations
- **AI-Powered Analytics**: Leverage OpenRouter integration for intelligent data analysis and insights
- **Session Management**: Save and restore your analysis sessions for later use
- **Performance Monitoring**: Built-in performance tracking for optimal user experience

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + React 18
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS 4
- **Code Quality**: ESLint + Prettier 3
- **Build**: Static export configured

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Modern web browser

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/jatinbansal1998/excel-explorer-website.git
   cd excel-explorer-website
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
# Build the application
npm run build

# Generate static export (outputs to `out/` directory)
npm run export

# Run linting and type checking
npm run lint
npm run type-check
```

## How to Use

### 1. Upload Your Excel File

- Click the upload button or drag and drop your Excel file
- Supported formats: .xlsx, .xls
- The app will automatically parse and validate your data

### 2. Explore Your Data

- View your data in the interactive data table
- Sort columns by clicking on headers
- Scroll through large datasets with optimized performance

### 3. Apply Filters

- **Date Range Filter**: Filter date columns within specific ranges
- **Numeric Range Filter**: Set min/max values for numeric columns
- **Search Filter**: Find specific text values
- **Select Filter**: Choose from unique values in categorical columns

### 4. Create Charts

- Click "Create Chart" to open the chart creation modal
- Select chart type (bar, line, pie, etc.)
- Configure axes, data series, and styling options
- Charts update dynamically based on your filters

### 5. Get AI Insights

- Use the Analytics Panel to get AI-powered insights about your data
- Ask questions about trends, patterns, and anomalies
- Get suggestions for data visualization and analysis approaches

### 6. Save Your Work

- Use the Session Manager to save your current analysis state
- Restore previous sessions to continue your work
- Sessions include your filters, charts, and data view settings

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ui/               # Base UI components
│   ├── charts/           # Chart-related components
│   ├── filters/          # Filter components
│   ├── analytics/        # Analytics panel
│   ├── openrouter/       # OpenRouter integration
│   └── session/          # Session management
├── hooks/                # Custom React hooks
├── services/             # Business logic services
├── types/                # TypeScript type definitions
└── utils/                # Utility functions
```

## Configuration

- **Next.js**: Configured for static export with optimized images
- **TypeScript**: Strict mode with path aliases (`@/*` → `src/*`)
- **Tailwind CSS**: v4 with token-first setup (`@import 'tailwindcss'` in `src/app/globals.css` and design tokens under `@theme`)
- **ESLint**: Extended Next.js configuration with Prettier integration

### Tailwind v4 Notes

- Use `gap-*` for spacing between flex/grid children (not `space-x-*` / `space-y-*`).
- Design tokens live in `src/app/globals.css` under `@theme` and map to Tailwind color scales.
- Utilities are available via the global `@import 'tailwindcss'`; no `@tailwind base/components/utilities` directives.

## Development

### Adding New Features

1. Create components in appropriate directories under `src/components/`
2. Add TypeScript types in `src/types/`
3. Implement business logic in `src/services/`
4. Create custom hooks in `src/hooks/` for reusable logic
5. Add utility functions in `src/utils/`

### Code Style

- Follow the established TypeScript patterns
- Use Tailwind CSS for styling
- Implement proper error handling with ErrorBoundary components
- Write clean, documented code with JSDoc comments

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Ensure all tests pass and linting is clean
5. Submit a pull request

## License

This project is open source and available under the MIT License.
