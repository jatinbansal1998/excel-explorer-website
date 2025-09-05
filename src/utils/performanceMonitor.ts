export interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, PerformanceMetric> = new Map();
  private completedMetrics: PerformanceMetric[] = [];

  static getInstance(): PerformanceMonitor {
    if (!this.instance) {
      this.instance = new PerformanceMonitor();
    }
    return this.instance;
  }

  startTiming(name: string, metadata?: Record<string, any>): void {
    const metric: PerformanceMetric = {
      name,
      startTime: performance.now(),
      metadata
    };
    this.metrics.set(name, metric);
  }

  endTiming(name: string): PerformanceMetric | null {
    const metric = this.metrics.get(name);
    if (!metric) {
      console.warn(`No timing started for: ${name}`);
      return null;
    }

    metric.endTime = performance.now();
    metric.duration = metric.endTime - metric.startTime;
    
    this.completedMetrics.push(metric);
    this.metrics.delete(name);
    
    // Log slow operations
    if (metric.duration > 1000) {
      console.warn(`Slow operation detected: ${name} took ${metric.duration.toFixed(2)}ms`);
    }
    
    return metric;
  }

  measureAsync<T>(
    name: string, 
    operation: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    return new Promise(async (resolve, reject) => {
      this.startTiming(name, metadata);
      try {
        const result = await operation();
        this.endTiming(name);
        resolve(result);
      } catch (error) {
        this.endTiming(name);
        reject(error);
      }
    });
  }

  measure<T>(
    name: string,
    operation: () => T,
    metadata?: Record<string, any>
  ): T {
    this.startTiming(name, metadata);
    try {
      const result = operation();
      this.endTiming(name);
      return result;
    } catch (error) {
      this.endTiming(name);
      throw error;
    }
  }

  getMetrics(): PerformanceMetric[] {
    return this.completedMetrics.slice();
  }

  getAverageTime(operationName: string): number {
    const operations = this.completedMetrics.filter(m => m.name === operationName);
    if (operations.length === 0) return 0;
    
    const totalTime = operations.reduce((sum, op) => sum + (op.duration || 0), 0);
    return totalTime / operations.length;
  }

  getTotalTime(operationName: string): number {
    const operations = this.completedMetrics.filter(m => m.name === operationName);
    return operations.reduce((sum, op) => sum + (op.duration || 0), 0);
  }

  getOperationCount(operationName: string): number {
    return this.completedMetrics.filter(m => m.name === operationName).length;
  }

  clearMetrics(): void {
    this.completedMetrics = [];
  }

  // Memory monitoring
  getMemoryUsage(): MemoryInfo | null {
    if ('memory' in performance) {
      return (performance as any).memory;
    }
    return null;
  }

  logMemoryUsage(context: string): void {
    const memory = this.getMemoryUsage();
    if (memory) {
      console.log(`Memory usage (${context}):`, {
        used: `${(memory.usedJSHeapSize / 1048576).toFixed(2)} MB`,
        total: `${(memory.totalJSHeapSize / 1048576).toFixed(2)} MB`,
        limit: `${(memory.jsHeapSizeLimit / 1048576).toFixed(2)} MB`
      });
    }
  }

  getMemoryPressure(): number {
    const memory = this.getMemoryUsage();
    if (!memory) return 0;
    
    return memory.usedJSHeapSize / memory.jsHeapSizeLimit;
  }

  isHighMemoryPressure(): boolean {
    return this.getMemoryPressure() > 0.8; // 80% threshold
  }

  // Performance summary
  getSummary(): PerformanceSummary {
    const uniqueOperations: string[] = [];
    for (let i = 0; i < this.completedMetrics.length; i++) {
      const n = this.completedMetrics[i].name;
      if (uniqueOperations.indexOf(n) === -1) uniqueOperations.push(n);
    }
    const operations = uniqueOperations.map(name => ({
      name,
      count: this.getOperationCount(name),
      totalTime: this.getTotalTime(name),
      averageTime: this.getAverageTime(name),
      minTime: Math.min(...this.completedMetrics.filter(m => m.name === name).map(m => m.duration || 0)),
      maxTime: Math.max(...this.completedMetrics.filter(m => m.name === name).map(m => m.duration || 0))
    }));

    return {
      totalOperations: this.completedMetrics.length,
      totalTime: this.completedMetrics.reduce((sum, op) => sum + (op.duration || 0), 0),
      operations,
      memoryInfo: this.getMemoryUsage()
    };
  }
}

export interface PerformanceSummary {
  totalOperations: number;
  totalTime: number;
  operations: {
    name: string;
    count: number;
    totalTime: number;
    averageTime: number;
    minTime: number;
    maxTime: number;
  }[];
  memoryInfo: MemoryInfo | null;
}

// Browser compatibility interface
interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}