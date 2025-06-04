// Adaptive Quality System for Performance Scaling
// Automatically adjusts visual quality based on device performance

class AdaptiveQuality {
  constructor(options = {}) {
    this.options = {
      enableAutoAdjust: true,
      targetFPS: 60,
      minFPS: 30,
      adjustmentThreshold: 5, // seconds before adjusting
      enableProfiling: true,
      ...options
    };
        
    this.qualityLevel = 'auto';
    this.currentSettings = {};
    this.performanceHistory = [];
    this.benchmarkResults = null;
    this.isMonitoring = false;
    this.adjustmentTimer = null;
        
    this.qualityPresets = this.defineQualityPresets();
    this.performanceMonitor = new PerformanceProfiler();
        
    this.init();
  }
    
  async init() {
    await this.detectDeviceCapabilities();
    await this.runInitialBenchmark();
    this.setupPerformanceMonitoring();
    this.applyInitialQuality();
  }
    
  defineQualityPresets() {
    return {
      ultra: {
        name: 'Ultra',
        description: 'Maximum visual quality for high-end devices',
        settings: {
          // Rendering
          pixelRatio: Math.min(window.devicePixelRatio, 2),
          antialias: true,
          shadows: 'high',
          shadowMapSize: 2048,
                    
          // Particles
          maxParticles: 5000,
          particleQuality: 'high',
          enableParticlePhysics: true,
                    
          // Post-processing
          postProcessing: 'full',
          bloom: true,
          ssao: true,
          motionBlur: true,
                    
          // Textures
          maxTextureSize: 2048,
          textureQuality: 'high',
          enableMipmaps: true,
                    
          // Animation
          animationQuality: 'high',
          morphTargets: true,
                    
          // WebGL
          enableFloatTextures: true,
          enableInstancing: true
        }
      },
            
      high: {
        name: 'High',
        description: 'High quality for modern devices',
        settings: {
          pixelRatio: Math.min(window.devicePixelRatio, 1.5),
          antialias: true,
          shadows: 'medium',
          shadowMapSize: 1024,
                    
          maxParticles: 2000,
          particleQuality: 'medium',
          enableParticlePhysics: true,
                    
          postProcessing: 'medium',
          bloom: true,
          ssao: false,
          motionBlur: false,
                    
          maxTextureSize: 1024,
          textureQuality: 'medium',
          enableMipmaps: true,
                    
          animationQuality: 'medium',
          morphTargets: true,
                    
          enableFloatTextures: true,
          enableInstancing: true
        }
      },
            
      medium: {
        name: 'Medium',
        description: 'Balanced quality and performance',
        settings: {
          pixelRatio: 1,
          antialias: false,
          shadows: 'low',
          shadowMapSize: 512,
                    
          maxParticles: 1000,
          particleQuality: 'low',
          enableParticlePhysics: false,
                    
          postProcessing: 'basic',
          bloom: false,
          ssao: false,
          motionBlur: false,
                    
          maxTextureSize: 512,
          textureQuality: 'low',
          enableMipmaps: false,
                    
          animationQuality: 'low',
          morphTargets: false,
                    
          enableFloatTextures: false,
          enableInstancing: false
        }
      },
            
      low: {
        name: 'Low',
        description: 'Performance optimized for older devices',
        settings: {
          pixelRatio: 0.75,
          antialias: false,
          shadows: 'disabled',
          shadowMapSize: 256,
                    
          maxParticles: 500,
          particleQuality: 'low',
          enableParticlePhysics: false,
                    
          postProcessing: 'disabled',
          bloom: false,
          ssao: false,
          motionBlur: false,
                    
          maxTextureSize: 256,
          textureQuality: 'low',
          enableMipmaps: false,
                    
          animationQuality: 'low',
          morphTargets: false,
                    
          enableFloatTextures: false,
          enableInstancing: false
        }
      },
            
      minimal: {
        name: 'Minimal',
        description: 'Basic functionality only',
        settings: {
          pixelRatio: 0.5,
          antialias: false,
          shadows: 'disabled',
          shadowMapSize: 128,
                    
          maxParticles: 100,
          particleQuality: 'disabled',
          enableParticlePhysics: false,
                    
          postProcessing: 'disabled',
          bloom: false,
          ssao: false,
          motionBlur: false,
                    
          maxTextureSize: 128,
          textureQuality: 'low',
          enableMipmaps: false,
                    
          animationQuality: 'disabled',
          morphTargets: false,
                    
          enableFloatTextures: false,
          enableInstancing: false
        }
      }
    };
  }
    
  async detectDeviceCapabilities() {
    this.deviceInfo = {
      // Hardware
      deviceMemory: navigator.deviceMemory || 4,
      hardwareConcurrency: navigator.hardwareConcurrency || 4,
            
      // Graphics
      webglRenderer: this.getWebGLRenderer(),
      maxTextureSize: this.getMaxTextureSize(),
      supportedExtensions: this.getSupportedWebGLExtensions(),
            
      // Platform
      isMobile: this.isMobileDevice(),
      isTablet: this.isTabletDevice(),
      platform: navigator.platform,
      userAgent: navigator.userAgent,
            
      // Network
      connection: navigator.connection,
            
      // Display
      screenResolution: {
        width: window.screen.width,
        height: window.screen.height
      },
      pixelRatio: window.devicePixelRatio || 1
    };
        
    console.log('Device capabilities detected:', this.deviceInfo);
  }
    
  getWebGLRenderer() {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            
      if (!gl) return 'none';
            
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        return gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      }
            
      return 'unknown';
    } catch (e) {
      return 'error';
    }
  }
    
  getMaxTextureSize() {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            
      if (!gl) return 512;
            
      return gl.getParameter(gl.MAX_TEXTURE_SIZE);
    } catch (e) {
      return 512;
    }
  }
    
  getSupportedWebGLExtensions() {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            
      if (!gl) return [];
            
      return gl.getSupportedExtensions() || [];
    } catch (e) {
      return [];
    }
  }
    
  isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }
    
  isTabletDevice() {
    return /iPad|Android(?!.*Mobile)/i.test(navigator.userAgent) || 
               (window.screen.width >= 768 && this.isMobileDevice());
  }
    
  async runInitialBenchmark() {
    if (!this.options.enableProfiling) {
      this.benchmarkResults = this.estimatePerformanceFromSpecs();
      return;
    }
        
    console.log('Running performance benchmark...');
        
    const startTime = performance.now();
        
    // CPU benchmark
    const cpuScore = await this.benchmarkCPU();
        
    // GPU benchmark
    const gpuScore = await this.benchmarkGPU();
        
    // Memory benchmark
    const memoryScore = this.benchmarkMemory();
        
    const totalTime = performance.now() - startTime;
        
    this.benchmarkResults = {
      cpu: cpuScore,
      gpu: gpuScore,
      memory: memoryScore,
      overall: (cpuScore + gpuScore + memoryScore) / 3,
      benchmarkTime: totalTime
    };
        
    console.log('Benchmark results:', this.benchmarkResults);
  }
    
  async benchmarkCPU() {
    // Fibonacci calculation benchmark
    const iterations = 100000;
    const startTime = performance.now();
        
    for (let i = 0; i < iterations; i++) {
      this.fibonacci(20);
    }
        
    const endTime = performance.now();
    const duration = endTime - startTime;
        
    // Score based on iterations per second
    const score = Math.min(100, (iterations / duration) * 10);
    return Math.round(score);
  }
    
  fibonacci(n) {
    if (n <= 1) return n;
    return this.fibonacci(n - 1) + this.fibonacci(n - 2);
  }
    
  async benchmarkGPU() {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
            
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) return 0;
            
      // Simple shader test
      const startTime = performance.now();
            
      const frames = 60;
      let frameCount = 0;
            
      return new Promise((resolve) => {
        const renderFrame = () => {
          // Simple rendering operations
          gl.clear(gl.COLOR_BUFFER_BIT);
          gl.drawArrays(gl.TRIANGLES, 0, 3);
                    
          frameCount++;
                    
          if (frameCount < frames) {
            requestAnimationFrame(renderFrame);
          } else {
            const endTime = performance.now();
            const fps = (frames / (endTime - startTime)) * 1000;
            const score = Math.min(100, fps * 1.5);
            resolve(Math.round(score));
          }
        };
                
        renderFrame();
      });
    } catch (e) {
      return 0;
    }
  }
    
  benchmarkMemory() {
    const memory = performance.memory;
    if (!memory) return 50; // Default score
        
    const available = memory.jsHeapSizeLimit / (1024 * 1024); // MB
    const used = memory.usedJSHeapSize / (1024 * 1024); // MB
    const ratio = used / available;
        
    // Score based on available memory and current usage
    const score = Math.max(0, Math.min(100, (available / 100) * (1 - ratio) * 100));
    return Math.round(score);
  }
    
  estimatePerformanceFromSpecs() {
    let score = 50; // Base score
        
    // Adjust based on device memory
    if (this.deviceInfo.deviceMemory >= 8) score += 20;
    else if (this.deviceInfo.deviceMemory >= 4) score += 10;
    else if (this.deviceInfo.deviceMemory < 2) score -= 20;
        
    // Adjust based on CPU cores
    if (this.deviceInfo.hardwareConcurrency >= 8) score += 15;
    else if (this.deviceInfo.hardwareConcurrency >= 4) score += 5;
    else if (this.deviceInfo.hardwareConcurrency < 2) score -= 15;
        
    // Adjust based on device type
    if (this.deviceInfo.isMobile) score -= 10;
    if (this.deviceInfo.isTablet) score -= 5;
        
    // Adjust based on WebGL support
    if (this.deviceInfo.webglRenderer === 'none') score -= 30;
    else if (this.deviceInfo.webglRenderer.includes('Intel')) score -= 10;
    else if (this.deviceInfo.webglRenderer.includes('NVIDIA') || 
                 this.deviceInfo.webglRenderer.includes('AMD')) score += 10;
        
    return {
      cpu: Math.max(0, Math.min(100, score)),
      gpu: Math.max(0, Math.min(100, score - 10)),
      memory: Math.max(0, Math.min(100, score + 5)),
      overall: Math.max(0, Math.min(100, score))
    };
  }
    
  applyInitialQuality() {
    const optimalLevel = this.determineOptimalQuality();
    this.setQualityLevel(optimalLevel);
  }
    
  determineOptimalQuality() {
    const score = this.benchmarkResults.overall;
        
    if (score >= 80) return 'ultra';
    if (score >= 65) return 'high';
    if (score >= 45) return 'medium';
    if (score >= 25) return 'low';
    return 'minimal';
  }
    
  setQualityLevel(level) {
    if (!this.qualityPresets[level]) {
      console.warn(`Invalid quality level: ${level}`);
      return;
    }
        
    this.qualityLevel = level;
    this.currentSettings = { ...this.qualityPresets[level].settings };
        
    console.log(`Quality level set to: ${level}`, this.currentSettings);
        
    // Apply settings to active renderers
    this.applySettingsToRenderers();
        
    // Emit quality change event
    window.dispatchEvent(new CustomEvent('quality-level-changed', {
      detail: {
        level,
        settings: this.currentSettings
      }
    }));
  }
    
  applySettingsToRenderers() {
    // Apply to Three.js renderers
    const renderers = this.findThreeJSRenderers();
    renderers.forEach(renderer => this.applyThreeJSSettings(renderer));
        
    // Apply to CSS animations
    this.applyCSSSettings();
        
    // Apply to particle systems
    this.applyParticleSettings();
        
    // Apply to shader materials
    this.applyShaderSettings();
  }
    
  findThreeJSRenderers() {
    const renderers = [];
        
    // Look for global Three.js instances
    if (window.THREE && window.renderer) {
      renderers.push(window.renderer);
    }
        
    // Look for renderers in canvas elements
    document.querySelectorAll('canvas').forEach(canvas => {
      if (canvas.renderer) {
        renderers.push(canvas.renderer);
      }
    });
        
    return renderers;
  }
    
  applyThreeJSSettings(renderer) {
    const settings = this.currentSettings;
        
    // Pixel ratio
    renderer.setPixelRatio(settings.pixelRatio);
        
    // Shadow settings
    if (settings.shadows === 'disabled') {
      renderer.shadowMap.enabled = false;
    } else {
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = this.getShadowMapType(settings.shadows);
    }
        
    // Antialias (requires renderer recreation, so we emit event)
    window.dispatchEvent(new CustomEvent('renderer-antialias-change', {
      detail: { antialias: settings.antialias }
    }));
  }
    
  getShadowMapType(shadowQuality) {
    if (!window.THREE) return 0;
        
    switch (shadowQuality) {
    case 'high': return THREE.PCFSoftShadowMap;
    case 'medium': return THREE.PCFShadowMap;
    case 'low': return THREE.BasicShadowMap;
    default: return THREE.BasicShadowMap;
    }
  }
    
  applyCSSSettings() {
    const root = document.documentElement;
    const settings = this.currentSettings;
        
    // Animation quality
    if (settings.animationQuality === 'disabled') {
      root.style.setProperty('--animation-duration', '0s');
    } else {
      root.style.setProperty('--animation-duration', 'var(--duration-normal)');
    }
        
    // Reduce motion for lower quality
    if (settings.animationQuality === 'low') {
      root.style.setProperty('--reduce-motion', '1');
    } else {
      root.style.setProperty('--reduce-motion', '0');
    }
  }
    
  applyParticleSettings() {
    window.dispatchEvent(new CustomEvent('particle-settings-change', {
      detail: {
        maxParticles: this.currentSettings.maxParticles,
        quality: this.currentSettings.particleQuality,
        physics: this.currentSettings.enableParticlePhysics
      }
    }));
  }
    
  applyShaderSettings() {
    window.dispatchEvent(new CustomEvent('shader-settings-change', {
      detail: {
        quality: this.currentSettings.postProcessing,
        enableBloom: this.currentSettings.bloom,
        enableSSAO: this.currentSettings.ssao,
        enableMotionBlur: this.currentSettings.motionBlur
      }
    }));
  }
    
  setupPerformanceMonitoring() {
    if (!this.options.enableAutoAdjust) return;
        
    this.performanceMonitor.startMonitoring();
        
    this.performanceMonitor.on('fps-update', (fps) => {
      this.recordPerformanceData(fps);
      this.checkForQualityAdjustment();
    });
        
    this.performanceMonitor.on('memory-pressure', (level) => {
      this.handleMemoryPressure(level);
    });
  }
    
  recordPerformanceData(fps) {
    const now = Date.now();
        
    this.performanceHistory.push({
      fps,
      timestamp: now,
      qualityLevel: this.qualityLevel
    });
        
    // Keep only last 30 seconds of data
    const cutoff = now - 30000;
    this.performanceHistory = this.performanceHistory.filter(
      data => data.timestamp > cutoff
    );
  }
    
  checkForQualityAdjustment() {
    if (this.performanceHistory.length < 10) return; // Need enough data
        
    const recentData = this.performanceHistory.slice(-10);
    const averageFPS = recentData.reduce((sum, data) => sum + data.fps, 0) / recentData.length;
        
    const targetFPS = this.options.targetFPS;
    const minFPS = this.options.minFPS;
        
    // Clear existing timer
    clearTimeout(this.adjustmentTimer);
        
    // Schedule adjustment check
    this.adjustmentTimer = setTimeout(() => {
      if (averageFPS < minFPS && this.canReduceQuality()) {
        this.reduceQuality();
      } else if (averageFPS > targetFPS * 1.2 && this.canIncreaseQuality()) {
        this.increaseQuality();
      }
    }, this.options.adjustmentThreshold * 1000);
  }
    
  canReduceQuality() {
    const levels = Object.keys(this.qualityPresets);
    const currentIndex = levels.indexOf(this.qualityLevel);
    return currentIndex < levels.length - 1;
  }
    
  canIncreaseQuality() {
    const levels = Object.keys(this.qualityPresets);
    const currentIndex = levels.indexOf(this.qualityLevel);
    return currentIndex > 0;
  }
    
  reduceQuality() {
    const levels = Object.keys(this.qualityPresets);
    const currentIndex = levels.indexOf(this.qualityLevel);
        
    if (currentIndex < levels.length - 1) {
      const newLevel = levels[currentIndex + 1];
      console.log(`Reducing quality from ${this.qualityLevel} to ${newLevel}`);
      this.setQualityLevel(newLevel);
            
      this.showQualityChangeNotification('reduced', newLevel);
    }
  }
    
  increaseQuality() {
    const levels = Object.keys(this.qualityPresets);
    const currentIndex = levels.indexOf(this.qualityLevel);
        
    if (currentIndex > 0) {
      const newLevel = levels[currentIndex - 1];
      console.log(`Increasing quality from ${this.qualityLevel} to ${newLevel}`);
      this.setQualityLevel(newLevel);
            
      this.showQualityChangeNotification('increased', newLevel);
    }
  }
    
  handleMemoryPressure(level) {
    if (level === 'critical') {
      // Force minimum quality
      this.setQualityLevel('minimal');
      this.showQualityChangeNotification('reduced', 'minimal', 'due to memory pressure');
    } else if (level === 'high' && this.canReduceQuality()) {
      this.reduceQuality();
    }
  }
    
  showQualityChangeNotification(action, level, reason = '') {
    const message = `Quality ${action} to ${level} ${reason}`.trim();
        
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'quality-notification';
    notification.textContent = message;
    notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: var(--bg-elevated, #1a1a1a);
            color: var(--text-primary, #fff);
            padding: 12px 20px;
            border-radius: 8px;
            border: 1px solid var(--border-color, #333);
            font-size: 14px;
            z-index: 10000;
            opacity: 0;
            transform: translateY(20px);
            transition: all 0.3s ease;
        `;
        
    document.body.appendChild(notification);
        
    // Animate in
    setTimeout(() => {
      notification.style.opacity = '1';
      notification.style.transform = 'translateY(0)';
    }, 10);
        
    // Remove after delay
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateY(20px)';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
    
  // Public API
  getCurrentQuality() {
    return {
      level: this.qualityLevel,
      settings: this.currentSettings,
      preset: this.qualityPresets[this.qualityLevel]
    };
  }
    
  getAvailableQualities() {
    return Object.keys(this.qualityPresets).map(level => ({
      level,
      ...this.qualityPresets[level]
    }));
  }
    
  setCustomQuality(settings) {
    this.qualityLevel = 'custom';
    this.currentSettings = { ...settings };
    this.applySettingsToRenderers();
  }
    
  resetToOptimal() {
    const optimalLevel = this.determineOptimalQuality();
    this.setQualityLevel(optimalLevel);
  }
    
  enableAutoAdjust() {
    this.options.enableAutoAdjust = true;
    this.setupPerformanceMonitoring();
  }
    
  disableAutoAdjust() {
    this.options.enableAutoAdjust = false;
    this.performanceMonitor.stopMonitoring();
    clearTimeout(this.adjustmentTimer);
  }
    
  getPerformanceStats() {
    return {
      benchmarkResults: this.benchmarkResults,
      deviceInfo: this.deviceInfo,
      currentQuality: this.qualityLevel,
      performanceHistory: this.performanceHistory.slice(-10), // Last 10 samples
      averageFPS: this.getAverageFPS()
    };
  }
    
  getAverageFPS() {
    if (this.performanceHistory.length === 0) return 0;
        
    const recent = this.performanceHistory.slice(-10);
    return recent.reduce((sum, data) => sum + data.fps, 0) / recent.length;
  }
    
  getSetting(key) {
    return this.currentSettings[key];
  }
    
  setSetting(key, value) {
    this.currentSettings[key] = value;
    this.applySettingsToRenderers();
  }
    
  exportSettings() {
    return JSON.stringify({
      level: this.qualityLevel,
      settings: this.currentSettings,
      timestamp: Date.now()
    });
  }
    
  importSettings(settingsJSON) {
    try {
      const imported = JSON.parse(settingsJSON);
      this.setCustomQuality(imported.settings);
      return true;
    } catch (e) {
      console.error('Failed to import settings:', e);
      return false;
    }
  }
    
  destroy() {
    this.performanceMonitor.destroy();
    clearTimeout(this.adjustmentTimer);
  }
}

// Performance Profiler for FPS monitoring
class PerformanceProfiler {
  constructor() {
    this.isMonitoring = false;
    this.frameCount = 0;
    this.lastTime = performance.now();
    this.fps = 60;
    this.callbacks = new Map();
    this.rafId = null;
  }
    
  startMonitoring() {
    if (this.isMonitoring) return;
        
    this.isMonitoring = true;
    this.frameCount = 0;
    this.lastTime = performance.now();
        
    this.monitorFrame();
  }
    
  stopMonitoring() {
    this.isMonitoring = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
  }
    
  monitorFrame() {
    if (!this.isMonitoring) return;
        
    const currentTime = performance.now();
    this.frameCount++;
        
    // Calculate FPS every second
    if (currentTime - this.lastTime >= 1000) {
      this.fps = (this.frameCount * 1000) / (currentTime - this.lastTime);
      this.emit('fps-update', this.fps);
            
      // Check memory if available
      if (performance.memory) {
        this.checkMemoryUsage();
      }
            
      this.frameCount = 0;
      this.lastTime = currentTime;
    }
        
    this.rafId = requestAnimationFrame(() => this.monitorFrame());
  }
    
  checkMemoryUsage() {
    const memory = performance.memory;
    const usageRatio = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
        
    let pressureLevel = 'normal';
    if (usageRatio > 0.9) pressureLevel = 'critical';
    else if (usageRatio > 0.7) pressureLevel = 'high';
    else if (usageRatio > 0.5) pressureLevel = 'medium';
        
    if (pressureLevel !== 'normal') {
      this.emit('memory-pressure', pressureLevel);
    }
  }
    
  on(event, callback) {
    if (!this.callbacks.has(event)) {
      this.callbacks.set(event, []);
    }
    this.callbacks.get(event).push(callback);
  }
    
  emit(event, data) {
    if (this.callbacks.has(event)) {
      this.callbacks.get(event).forEach(callback => callback(data));
    }
  }
    
  destroy() {
    this.stopMonitoring();
    this.callbacks.clear();
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AdaptiveQuality;
}

// Initialize if in browser
if (typeof window !== 'undefined') {
  window.AdaptiveQuality = AdaptiveQuality;
}