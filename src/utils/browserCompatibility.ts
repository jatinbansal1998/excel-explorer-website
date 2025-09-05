interface CompatibilityReport {
  isCompatible: boolean;
  features: Record<string, boolean>;
  warnings: string[];
  recommendations: string[];
}

export class BrowserCompatibility {
  static checkCompatibility(): CompatibilityReport {
    const features = {
      fileAPI: this.checkFileAPI(),
      webWorkers: this.checkWebWorkers(),
      canvas: this.checkCanvas(),
      localStorage: this.checkLocalStorage(),
      modern: this.checkModernFeatures(),
      webGL: this.checkWebGL(),
      indexedDB: this.checkIndexedDB(),
      fetch: this.checkFetch(),
      promises: this.checkPromises()
    };
    
    const isCompatible = Object.values(features).every(Boolean);
    const warnings = this.getWarnings(features);
    
    return {
      isCompatible,
      features,
      warnings,
      recommendations: this.getRecommendations(features)
    };
  }

  static getMinimalCompatibility(): CompatibilityReport {
    const essential = {
      fileAPI: this.checkFileAPI(),
      localStorage: this.checkLocalStorage(),
      modern: this.checkModernFeatures()
    };
    
    const isCompatible = Object.values(essential).every(Boolean);
    
    return {
      isCompatible,
      features: essential,
      warnings: this.getWarnings(essential),
      recommendations: this.getRecommendations(essential)
    };
  }

  private static checkFileAPI(): boolean {
    return !!(window.File && window.FileReader && window.FileList && window.Blob);
  }

  private static checkWebWorkers(): boolean {
    return typeof Worker !== 'undefined';
  }

  private static checkCanvas(): boolean {
    try {
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext && canvas.getContext('2d'));
    } catch {
      return false;
    }
  }

  private static checkWebGL(): boolean {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      return !!gl;
    } catch {
      return false;
    }
  }

  private static checkLocalStorage(): boolean {
    try {
      const test = '__localStorage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  private static checkIndexedDB(): boolean {
    return !!(window.indexedDB || (window as any).mozIndexedDB || (window as any).webkitIndexedDB || (window as any).msIndexedDB);
  }

  private static checkFetch(): boolean {
    return typeof fetch !== 'undefined';
  }

  private static checkPromises(): boolean {
    return typeof Promise !== 'undefined';
  }

  private static checkModernFeatures(): boolean {
    return !!(
      typeof Promise !== 'undefined' &&
      typeof Object.assign === 'function' &&
      typeof window !== 'undefined' && 
      typeof window.fetch === 'function'
    );
  }

  private static getWarnings(features: Record<string, boolean>): string[] {
    const warnings: string[] = [];
    
    if (!features.fileAPI) {
      warnings.push('File API not supported. File upload may not work properly.');
    }
    
    if (!features.webWorkers) {
      warnings.push('Web Workers not supported. Large file processing may block the UI.');
    }
    
    if (!features.canvas) {
      warnings.push('Canvas not supported. Charts may not display properly.');
    }
    
    if (!features.localStorage) {
      warnings.push('Local Storage not supported. Settings cannot be saved.');
    }
    
    if (!features.modern) {
      warnings.push('Modern JavaScript features not supported. App may not function correctly.');
    }
    
    if (features.webGL === false) {
      warnings.push('WebGL not supported. Advanced chart features may be limited.');
    }
    
    if (features.indexedDB === false) {
      warnings.push('IndexedDB not supported. Large data caching will be limited.');
    }
    
    return warnings;
  }

  private static getRecommendations(features: Record<string, boolean>): string[] {
    const recommendations: string[] = [];
    
    if (!features.modern) {
      recommendations.push('Please update to a modern browser (Chrome 60+, Firefox 60+, Safari 12+, Edge 79+) for the best experience.');
    }
    
    if (Object.values(features).some(f => !f)) {
      recommendations.push('Some features may be limited in your browser. Consider updating or switching browsers.');
    }
    
    // Browser-specific recommendations
    const userAgent = navigator.userAgent;
    if (userAgent.includes('MSIE') || userAgent.includes('Trident')) {
      recommendations.push('Internet Explorer is not supported. Please use a modern browser like Chrome, Firefox, Safari, or Edge.');
    }
    
    if (userAgent.includes('Chrome/') && parseInt(userAgent.split('Chrome/')[1]) < 60) {
      recommendations.push('Your Chrome version is outdated. Please update to the latest version.');
    }
    
    if (userAgent.includes('Firefox/') && parseInt(userAgent.split('Firefox/')[1]) < 60) {
      recommendations.push('Your Firefox version is outdated. Please update to the latest version.');
    }
    
    return recommendations;
  }

  // Browser detection utilities
  static getBrowserInfo(): BrowserInfo {
    const userAgent = navigator.userAgent;
    
    let browser = 'Unknown';
    let version = 'Unknown';
    
    if (userAgent.includes('Chrome')) {
      browser = 'Chrome';
      const match = userAgent.match(/Chrome\/(\d+)/);
      version = match ? match[1] : 'Unknown';
    } else if (userAgent.includes('Firefox')) {
      browser = 'Firefox';
      const match = userAgent.match(/Firefox\/(\d+)/);
      version = match ? match[1] : 'Unknown';
    } else if (userAgent.includes('Safari')) {
      browser = 'Safari';
      const match = userAgent.match(/Version\/(\d+)/);
      version = match ? match[1] : 'Unknown';
    } else if (userAgent.includes('Edge')) {
      browser = 'Edge';
      const match = userAgent.match(/Edge\/(\d+)/);
      version = match ? match[1] : 'Unknown';
    } else if (userAgent.includes('MSIE') || userAgent.includes('Trident')) {
      browser = 'Internet Explorer';
      const match = userAgent.match(/(?:MSIE |rv:)(\d+)/);
      version = match ? match[1] : 'Unknown';
    }
    
    return {
      browser,
      version,
      userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine
    };
  }

  static checkPerformanceAPI(): boolean {
    return !!(window.performance && window.performance.now);
  }

  static checkWebAssembly(): boolean {
    return typeof WebAssembly !== 'undefined';
  }

  static checkServiceWorker(): boolean {
    return 'serviceWorker' in navigator;
  }

  static getDeviceInfo(): DeviceInfo {
    return {
      deviceMemory: (navigator as any).deviceMemory || null,
      hardwareConcurrency: navigator.hardwareConcurrency || null,
      maxTouchPoints: navigator.maxTouchPoints || 0,
      userAgent: navigator.userAgent,
      screenWidth: screen.width,
      screenHeight: screen.height,
      colorDepth: screen.colorDepth,
      pixelDepth: screen.pixelDepth
    };
  }

  static async checkNetworkConnection(): Promise<NetworkInfo> {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    if (!connection) {
      return {
        supported: false,
        effectiveType: 'unknown',
        downlink: null,
        rtt: null
      };
    }
    
    return {
      supported: true,
      effectiveType: connection.effectiveType || 'unknown',
      downlink: connection.downlink || null,
      rtt: connection.rtt || null
    };
  }
}

export interface BrowserInfo {
  browser: string;
  version: string;
  userAgent: string;
  platform: string;
  language: string;
  cookieEnabled: boolean;
  onLine: boolean;
}

export interface DeviceInfo {
  deviceMemory: number | null;
  hardwareConcurrency: number | null;
  maxTouchPoints: number;
  userAgent: string;
  screenWidth: number;
  screenHeight: number;
  colorDepth: number;
  pixelDepth: number;
}

export interface NetworkInfo {
  supported: boolean;
  effectiveType: string;
  downlink: number | null;
  rtt: number | null;
}