# Plan 05: Data Visualization & Charts

## Engineer Assignment
**Primary Engineer**: Data Visualization/Frontend Engineer
**Dependencies**: Plan 02 (Data Processing) must be completed first
**Estimated Time**: 3-4 days
**Can work in parallel with**: Plans 03, 04 after Plan 02

## Overview
Implement dynamic chart generation system that automatically suggests and creates appropriate visualizations based on data types, with real-time updates when filters change.

## Deliverables

### 1. Chart Generation Engine
- [ ] Automatic chart type suggestion based on data
- [ ] Data aggregation and preparation for charts
- [ ] Real-time chart updates with filter changes
- [ ] Interactive chart controls and configuration

### 2. Chart Components
- [ ] Pie chart for categorical data distribution
- [ ] Bar chart for categorical comparisons
- [ ] Line chart for time series data
- [ ] Histogram for numeric distribution
- [ ] Scatter plot for correlation analysis

### 3. Chart Management System
- [ ] Chart configuration interface
- [ ] Multiple chart support
- [ ] Chart export functionality
- [ ] Chart responsiveness and optimization

## Dependencies to Install
```json
{
  "chart.js": "^4.4.0",
  "react-chartjs-2": "^5.2.0",
  "chartjs-adapter-date-fns": "^3.0.0",
  "date-fns": "^2.30.0"
}
```

## Core Interfaces

### Chart Configuration (src/types/chart.ts)
```typescript
export interface ChartConfig {
  id: string;
  title: string;
  type: ChartType;
  dataColumn: string;
  labelColumn?: string;
  aggregation: AggregationType;
  options: ChartOptions;
  position: ChartPosition;
}

export type ChartType = 
  | 'pie' 
  | 'doughnut'
  | 'bar' 
  | 'horizontalBar'
  | 'line'
  | 'area'
  | 'scatter'
  | 'histogram';

export type AggregationType = 
  | 'count'        // Count occurrences
  | 'sum'          // Sum numeric values
  | 'average'      // Average numeric values
  | 'min'          // Minimum value
  | 'max'          // Maximum value
  | 'median'       // Median value
  | 'distinct';    // Count distinct values

export interface ChartOptions {
  responsive: boolean;
  maintainAspectRatio: boolean;
  plugins: {
    legend: {
      display: boolean;
      position: 'top' | 'bottom' | 'left' | 'right';
    };
    title: {
      display: boolean;
      text: string;
    };
    tooltip: {
      enabled: boolean;
      callbacks?: any;
    };
  };
  scales?: any;
  animation?: {
    duration: number;
    easing: string;
  };
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string | string[];
    borderColor: string | string[];
    borderWidth: number;
  }[];
}

export type ChartPosition = {
  row: number;
  column: number;
  width: number;
  height: number;
};
```

## Services to Implement

### 1. Chart Suggestion Engine (src/services/chartSuggestion.ts)
```typescript
export class ChartSuggestionEngine {
  suggestCharts(
    columns: ColumnInfo[], 
    filteredData: any[][]
  ): ChartSuggestion[] {
    const suggestions: ChartSuggestion[] = [];
    
    // Analyze data characteristics
    const categoricalColumns = columns.filter(c => c.type === 'string');
    const numericColumns = columns.filter(c => c.type === 'number');
    const dateColumns = columns.filter(c => c.type === 'date');
    
    // Generate suggestions based on data types
    suggestions.push(...this.suggestCategoricalCharts(categoricalColumns));
    suggestions.push(...this.suggestNumericCharts(numericColumns));
    suggestions.push(...this.suggestTimeSeriesCharts(dateColumns, numericColumns));
    suggestions.push(...this.suggestCorrelationCharts(numericColumns));
    
    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  private suggestCategoricalCharts(columns: ColumnInfo[]): ChartSuggestion[] {
    return columns.map(column => ({
      type: 'pie',
      title: `Distribution of ${column.name}`,
      dataColumn: column.name,
      aggregation: 'count',
      confidence: this.calculateConfidence(column),
      reason: 'Categorical data is ideal for pie charts'
    }));
  }

  private suggestNumericCharts(columns: ColumnInfo[]): ChartSuggestion[] {
    return columns.map(column => ({
      type: 'histogram',
      title: `Distribution of ${column.name}`,
      dataColumn: column.name,
      aggregation: 'count',
      confidence: this.calculateConfidence(column),
      reason: 'Numeric data distribution analysis'
    }));
  }

  private calculateConfidence(column: ColumnInfo): number;
}

interface ChartSuggestion {
  type: ChartType;
  title: string;
  dataColumn: string;
  labelColumn?: string;
  aggregation: AggregationType;
  confidence: number; // 0-1
  reason: string;
}
```

### 2. Chart Data Processor (src/services/chartDataProcessor.ts)
```typescript
export class ChartDataProcessor {
  prepareChartData(
    data: any[][], 
    config: ChartConfig, 
    columnInfo: ColumnInfo[]
  ): ChartData {
    const columnIndex = this.findColumnIndex(config.dataColumn, columnInfo);
    const labelIndex = config.labelColumn 
      ? this.findColumnIndex(config.labelColumn, columnInfo) 
      : null;

    switch (config.type) {
      case 'pie':
      case 'doughnut':
        return this.preparePieData(data, columnIndex, labelIndex, config);
      case 'bar':
      case 'horizontalBar':
        return this.prepareBarData(data, columnIndex, labelIndex, config);
      case 'line':
      case 'area':
        return this.prepareLineData(data, columnIndex, labelIndex, config);
      case 'scatter':
        return this.prepareScatterData(data, columnIndex, labelIndex, config);
      case 'histogram':
        return this.prepareHistogramData(data, columnIndex, config);
      default:
        throw new Error(`Unsupported chart type: ${config.type}`);
    }
  }

  private preparePieData(
    data: any[][], 
    dataColumn: number, 
    labelColumn: number | null, 
    config: ChartConfig
  ): ChartData {
    const aggregated = this.aggregateData(data, dataColumn, labelColumn, config.aggregation);
    
    return {
      labels: aggregated.map(item => item.label),
      datasets: [{
        label: config.title,
        data: aggregated.map(item => item.value),
        backgroundColor: this.generateColors(aggregated.length),
        borderColor: this.generateBorderColors(aggregated.length),
        borderWidth: 2
      }]
    };
  }

  private aggregateData(
    data: any[][], 
    dataColumn: number, 
    labelColumn: number | null, 
    aggregation: AggregationType
  ): AggregatedItem[] {
    const groups = new Map<string, number[]>();
    
    data.forEach(row => {
      const label = labelColumn !== null 
        ? String(row[labelColumn] || 'Unknown')
        : 'Value';
      const value = row[dataColumn];
      
      if (!groups.has(label)) {
        groups.set(label, []);
      }
      groups.get(label)!.push(value);
    });

    return Array.from(groups.entries()).map(([label, values]) => ({
      label,
      value: this.applyAggregation(values, aggregation)
    }));
  }

  private applyAggregation(values: any[], type: AggregationType): number {
    switch (type) {
      case 'count':
        return values.length;
      case 'sum':
        return values.reduce((sum, val) => sum + (Number(val) || 0), 0);
      case 'average':
        const validValues = values.filter(v => !isNaN(Number(v)));
        return validValues.length > 0 
          ? validValues.reduce((sum, val) => sum + Number(val), 0) / validValues.length 
          : 0;
      case 'min':
        return Math.min(...values.map(v => Number(v)).filter(v => !isNaN(v)));
      case 'max':
        return Math.max(...values.map(v => Number(v)).filter(v => !isNaN(v)));
      case 'median':
        const sorted = values.map(v => Number(v)).filter(v => !isNaN(v)).sort();
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 === 0 
          ? (sorted[mid - 1] + sorted[mid]) / 2 
          : sorted[mid];
      case 'distinct':
        return new Set(values).size;
      default:
        return 0;
    }
  }

  generateColors(count: number): string[];
  generateBorderColors(count: number): string[];
}

interface AggregatedItem {
  label: string;
  value: number;
}
```

## Chart Components

### 1. Chart Container (src/components/ChartView.tsx)
```typescript
interface ChartViewProps {
  filteredData: any[][];
  columnInfo: ColumnInfo[];
  onChartAdd?: (config: ChartConfig) => void;
  onChartRemove?: (chartId: string) => void;
}

export function ChartView({ 
  filteredData, 
  columnInfo, 
  onChartAdd, 
  onChartRemove 
}: ChartViewProps) {
  const [charts, setCharts] = useState<ChartConfig[]>([]);
  const [suggestions, setSuggestions] = useState<ChartSuggestion[]>([]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Data Visualization</h2>
        <ChartControls 
          suggestions={suggestions}
          onAddChart={handleAddChart}
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {charts.map(chart => (
          <ChartContainer
            key={chart.id}
            config={chart}
            data={filteredData}
            columnInfo={columnInfo}
            onConfigChange={(updates) => handleChartUpdate(chart.id, updates)}
            onRemove={() => onChartRemove?.(chart.id)}
          />
        ))}
      </div>
      
      {charts.length === 0 && (
        <EmptyChartState 
          suggestions={suggestions.slice(0, 3)}
          onAddChart={handleAddChart}
        />
      )}
    </div>
  );
}
```

### 2. Individual Chart Component (src/components/charts/ChartContainer.tsx)
```typescript
interface ChartContainerProps {
  config: ChartConfig;
  data: any[][];
  columnInfo: ColumnInfo[];
  onConfigChange: (updates: Partial<ChartConfig>) => void;
  onRemove: () => void;
}

export function ChartContainer({
  config,
  data,
  columnInfo,
  onConfigChange,
  onRemove
}: ChartContainerProps) {
  const chartData = useMemo(() => {
    return chartDataProcessor.prepareChartData(data, config, columnInfo);
  }, [data, config, columnInfo]);

  return (
    <div className="bg-white p-4 rounded-lg shadow border">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium">{config.title}</h3>
        <div className="flex gap-2">
          <ChartConfigButton 
            config={config}
            onConfigChange={onConfigChange}
          />
          <ChartExportButton chartData={chartData} title={config.title} />
          <Button variant="ghost" size="sm" onClick={onRemove}>
            <XIcon className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      <div className="relative h-64">
        {config.type === 'pie' || config.type === 'doughnut' ? (
          <Pie data={chartData} options={config.options} />
        ) : config.type === 'bar' || config.type === 'horizontalBar' ? (
          <Bar data={chartData} options={config.options} />
        ) : config.type === 'line' || config.type === 'area' ? (
          <Line data={chartData} options={config.options} />
        ) : config.type === 'scatter' ? (
          <Scatter data={chartData} options={config.options} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Unsupported chart type
          </div>
        )}
      </div>
    </div>
  );
}
```

### 3. Chart Configuration Modal (src/components/charts/ChartConfigModal.tsx)
```typescript
interface ChartConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ChartConfig;
  columnInfo: ColumnInfo[];
  onSave: (config: ChartConfig) => void;
}

export function ChartConfigModal({
  isOpen,
  onClose,
  config,
  columnInfo,
  onSave
}: ChartConfigModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Chart Configuration">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Chart Title</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Chart Type</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({...formData, type: e.target.value as ChartType})}
            className="w-full border rounded px-3 py-2"
          >
            <option value="pie">Pie Chart</option>
            <option value="bar">Bar Chart</option>
            <option value="line">Line Chart</option>
            <option value="scatter">Scatter Plot</option>
            <option value="histogram">Histogram</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Data Column</label>
          <select
            value={formData.dataColumn}
            onChange={(e) => setFormData({...formData, dataColumn: e.target.value})}
            className="w-full border rounded px-3 py-2"
          >
            {columnInfo.map(col => (
              <option key={col.name} value={col.name}>
                {col.name} ({col.type})
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            Save Chart
          </Button>
        </div>
      </form>
    </Modal>
  );
}
```

## Real-time Updates Hook

### Chart Data Management (src/hooks/useCharts.ts)
```typescript
export function useCharts(
  filteredData: any[][], 
  columnInfo: ColumnInfo[]
) {
  const [charts, setCharts] = useState<ChartConfig[]>([]);
  const [suggestions, setSuggestions] = useState<ChartSuggestion[]>([]);

  // Generate suggestions when data changes
  useEffect(() => {
    if (filteredData.length > 0 && columnInfo.length > 0) {
      const newSuggestions = chartSuggestionEngine.suggestCharts(
        columnInfo, 
        filteredData
      );
      setSuggestions(newSuggestions);
    }
  }, [filteredData, columnInfo]);

  // Auto-create default chart if none exist
  useEffect(() => {
    if (charts.length === 0 && suggestions.length > 0) {
      const defaultChart = createChartFromSuggestion(suggestions[0]);
      setCharts([defaultChart]);
    }
  }, [suggestions, charts.length]);

  const addChart = useCallback((suggestion: ChartSuggestion) => {
    const newChart = createChartFromSuggestion(suggestion);
    setCharts(prev => [...prev, newChart]);
  }, []);

  const updateChart = useCallback((chartId: string, updates: Partial<ChartConfig>) => {
    setCharts(prev => prev.map(chart => 
      chart.id === chartId ? { ...chart, ...updates } : chart
    ));
  }, []);

  const removeChart = useCallback((chartId: string) => {
    setCharts(prev => prev.filter(chart => chart.id !== chartId));
  }, []);

  return {
    charts,
    suggestions,
    addChart,
    updateChart,
    removeChart
  };
}
```

## Export Functionality

### Chart Export Service (src/services/chartExport.ts)
```typescript
export class ChartExportService {
  exportToPNG(chartElement: HTMLCanvasElement, title: string): void {
    const link = document.createElement('a');
    link.download = `${title}.png`;
    link.href = chartElement.toDataURL();
    link.click();
  }

  exportToSVG(chartData: ChartData, config: ChartConfig): void {
    // SVG generation logic
  }

  exportChartData(chartData: ChartData, title: string): void {
    const csv = this.convertToCSV(chartData);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.download = `${title}-data.csv`;
    link.href = url;
    link.click();
    
    URL.revokeObjectURL(url);
  }

  private convertToCSV(chartData: ChartData): string;
}
```

## Files to Create
- [ ] `src/services/chartSuggestion.ts`
- [ ] `src/services/chartDataProcessor.ts`
- [ ] `src/services/chartExport.ts`
- [ ] `src/components/ChartView.tsx`
- [ ] `src/components/charts/ChartContainer.tsx`
- [ ] `src/components/charts/ChartConfigModal.tsx`
- [ ] `src/components/charts/ChartControls.tsx`
- [ ] `src/hooks/useCharts.ts`
- [ ] `src/types/chart.ts`

## Performance Considerations
- [ ] Memoize chart data processing
- [ ] Debounce chart updates during filtering
- [ ] Optimize chart rendering for large datasets
- [ ] Lazy load chart configurations
- [ ] Efficient color generation and caching

## Integration Points
- **Filter Team**: Subscribe to filtered data changes
- **Data Team**: Use column information and statistics
- **UI Team**: Integrate into ChartView component slot
- **Utils Team**: Export functionality integration

## Validation Criteria
- [ ] Charts render correctly for all data types
- [ ] Real-time updates work smoothly with filters
- [ ] Chart suggestions are relevant and accurate
- [ ] Export functionality works for all formats
- [ ] Performance acceptable with large datasets
- [ ] Charts are responsive and accessible

## Notes for Integration Teams
- **Filter Team**: Charts will automatically update when `filteredData` changes
- **UI Team**: ChartView component fits into your grid layout system
- **Data Team**: Chart suggestions use your ColumnInfo statistics
- **Utils Team**: Export system integrates with your file handling utilities