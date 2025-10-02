import { useEffect, useRef, useState, useCallback } from 'react';

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  reRenderCount: number;
  lastRenderDuration: number;
  componentMountTime: number;
}

interface UsePerformanceMonitorReturn extends PerformanceMetrics {
  startMeasurement: (measurementName: string) => void;
  endMeasurement: (measurementName: string) => number;
  measureAsyncOperation: (
    operation: () => Promise<any>,
    operationName: string
  ) => Promise<any>;
  getMetricsSummary: () => {
    avgRenderTime: number;
    totalReRenders: number;
    memoryDelta: number;
    performanceScore: 'excellent' | 'good' | 'fair' | 'poor';
  };
}

export function usePerformanceMonitor(
  componentName: string,
  enableLogging: boolean = false
): UsePerformanceMonitorReturn {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    memoryUsage: 0,
    reRenderCount: 0,
    lastRenderDuration: 0,
    componentMountTime: 0,
  });

  const renderStartTime = useRef<number>(0);
  const initialMemory = useRef<number>(0);
  const renderTimes = useRef<number[]>([]);
  const measurementCache = useRef<Map<string, number>>(new Map());
  const componentMountTime = useRef<number>(0);

  // Initialize performance monitoring
  useEffect(() => {
    componentMountTime.current = performance.now();
    initialMemory.current = (performance as any).memory?.usedJSHeapSize || 0;
    
    setMetrics(prev => ({
      ...prev,
      componentMountTime: componentMountTime.current
    }));

    if (enableLogging) {
      console.log(`🚀 ${componentName} mounted at ${componentMountTime.current.toFixed(2)}ms`);
    }
  }, [componentName, enableLogging]);

  // Track re-renders
  useEffect(() => {
    renderStartTime.current = performance.now();
    
    setMetrics(prev => ({
      ...prev,
      reRenderCount: prev.reRenderCount + 1
    }));
  });

  // Measure render completion
  useEffect(() => {
    const renderEndTime = performance.now();
    const renderDuration = renderEndTime - renderStartTime.current;
    
    renderTimes.current.push(renderDuration);
    
    // Keep only last 50 render times
    if (renderTimes.current.length > 50) {
      renderTimes.current = renderTimes.current.slice(-50);
    }

    const avgRenderTime = renderTimes.current.reduce((a, b) => a + b, 0) / renderTimes.current.length;
    const currentMemory = (performance as any).memory?.usedJSHeapSize || 0;

    setMetrics(prev => ({
      ...prev,
      renderTime: avgRenderTime,
      lastRenderDuration: renderDuration,
      memoryUsage: currentMemory
    }));

    if (enableLogging && renderDuration > 16) { // Highlight slow renders (> 1 frame)
      console.warn(`⚠️ ${componentName} slow render: ${renderDuration.toFixed(2)}ms`);
    }
  });

  const startMeasurement = useCallback((measurementName: string) => {
    measurementCache.current.set(measurementName, performance.now());
  }, []);

  const endMeasurement = useCallback((measurementName: string): number => {
    const startTime = measurementCache.current.get(measurementName);
    if (!startTime) {
      console.warn(`No start time found for measurement: ${measurementName}`);
      return 0;
    }
    
    const duration = performance.now() - startTime;
    measurementCache.current.delete(measurementName);
    
    if (enableLogging) {
      console.log(`📊 ${componentName} - ${measurementName}: ${duration.toFixed(2)}ms`);
    }
    
    return duration;
  }, [componentName, enableLogging]);

  const measureAsyncOperation = useCallback(async (
    operation: () => Promise<any>,
    operationName: string
  ): Promise<any> => {
    const startTime = performance.now();
    
    try {
      const result = await operation();
      const duration = performance.now() - startTime;
      
      if (enableLogging) {
        console.log(`⚡ ${componentName} - ${operationName}: ${duration.toFixed(2)}ms`);
      }
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      if (enableLogging) {
        console.error(`❌ ${componentName} - ${operationName} failed after ${duration.toFixed(2)}ms:`, error);
      }
      
      throw error;
    }
  }, [componentName, enableLogging]);

  const getMetricsSummary = useCallback(() => {
    const avgRenderTime = renderTimes.current.length > 0 
      ? renderTimes.current.reduce((a, b) => a + b, 0) / renderTimes.current.length 
      : 0;
    
    const memoryDelta = metrics.memoryUsage - initialMemory.current;
    
    // Performance scoring based on render time and re-renders
    let performanceScore: 'excellent' | 'good' | 'fair' | 'poor' = 'excellent';
    
    if (avgRenderTime > 50 || metrics.reRenderCount > 100) {
      performanceScore = 'poor';
    } else if (avgRenderTime > 20 || metrics.reRenderCount > 50) {
      performanceScore = 'fair';
    } else if (avgRenderTime > 10 || metrics.reRenderCount > 20) {
      performanceScore = 'good';
    }

    return {
      avgRenderTime,
      totalReRenders: metrics.reRenderCount,
      memoryDelta,
      performanceScore
    };
  }, [metrics]);

  return {
    ...metrics,
    startMeasurement,
    endMeasurement,
    measureAsyncOperation,
    getMetricsSummary
  };
}