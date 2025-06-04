/**
 * Jest Setup for Phase 6: Testing and Quality Assurance
 * Global test configuration and utilities
 */

// Mock browser APIs
global.fetch = jest.fn();
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock WebGL context
global.WebGLRenderingContext = jest.fn().mockImplementation(() => ({}));
global.WebGL2RenderingContext = jest.fn().mockImplementation(() => ({}));

// Mock canvas
HTMLCanvasElement.prototype.getContext = jest.fn().mockImplementation((type) => {
  if (type === 'webgl' || type === 'webgl2') {
    return {
      clearColor: jest.fn(),
      clear: jest.fn(),
      drawArrays: jest.fn(),
      drawElements: jest.fn(),
      useProgram: jest.fn(),
      createShader: jest.fn(),
      createProgram: jest.fn(),
      linkProgram: jest.fn(),
      getProgramParameter: jest.fn().mockReturnValue(true),
      getShaderParameter: jest.fn().mockReturnValue(true),
      getExtension: jest.fn(),
      viewport: jest.fn(),
      enable: jest.fn(),
      disable: jest.fn(),
      blendFunc: jest.fn(),
      clearDepth: jest.fn()
    };
  }
  return {
    fillRect: jest.fn(),
    clearRect: jest.fn(),
    getImageData: jest.fn(),
    putImageData: jest.fn(),
    createImageData: jest.fn(),
    setTransform: jest.fn(),
    drawImage: jest.fn(),
    save: jest.fn(),
    restore: jest.fn(),
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    closePath: jest.fn(),
    stroke: jest.fn(),
    fill: jest.fn()
  };
});

// Mock performance API
global.performance = {
  now: jest.fn(() => Date.now()),
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByName: jest.fn(() => []),
  getEntriesByType: jest.fn(() => []),
  clearMarks: jest.fn(),
  clearMeasures: jest.fn()
};

// Mock navigation API
global.navigator = {
  ...global.navigator,
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  platform: 'MacIntel',
  hardwareConcurrency: 8,
  deviceMemory: 8,
  connection: {
    effectiveType: '4g',
    downlink: 10,
    rtt: 100
  }
};

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn()
};
global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn()
};
global.sessionStorage = sessionStorageMock;

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn().mockImplementation((cb) => {
  return setTimeout(cb, 16); // ~60fps
});
global.cancelAnimationFrame = jest.fn().mockImplementation((id) => {
  clearTimeout(id);
});

// Mock URL API
global.URL = {
  createObjectURL: jest.fn(() => 'mocked-url'),
  revokeObjectURL: jest.fn()
};

// Mock File API
global.File = jest.fn().mockImplementation((bits, filename, options) => ({
  name: filename,
  size: bits.length,
  type: options?.type || 'text/plain',
  lastModified: Date.now()
}));

// Mock Blob API
global.Blob = jest.fn().mockImplementation((parts, options) => ({
  size: parts.reduce((total, part) => total + part.length, 0),
  type: options?.type || '',
  slice: jest.fn()
}));

// Test utilities
global.testUtils = {
  // Wait for async operations
  waitFor: (ms = 0) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Mock DOM element
  createMockElement: (tag = 'div', attributes = {}) => {
    const element = document.createElement(tag);
    Object.assign(element, attributes);
    return element;
  },
  
  // Mock event
  createMockEvent: (type, properties = {}) => {
    const event = new Event(type);
    Object.assign(event, properties);
    return event;
  },
  
  // Mock WebGL context
  createMockWebGLContext: () => ({
    canvas: global.testUtils.createMockElement('canvas'),
    clearColor: jest.fn(),
    clear: jest.fn(),
    viewport: jest.fn(),
    createShader: jest.fn(),
    createProgram: jest.fn(),
    linkProgram: jest.fn(),
    useProgram: jest.fn(),
    getExtension: jest.fn(),
    getParameter: jest.fn(),
    isContextLost: jest.fn(() => false)
  }),
  
  // Mock Three.js Scene
  createMockScene: () => ({
    add: jest.fn(),
    remove: jest.fn(),
    children: [],
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 }
  }),
  
  // Mock Three.js Renderer
  createMockRenderer: () => ({
    render: jest.fn(),
    setSize: jest.fn(),
    setClearColor: jest.fn(),
    dispose: jest.fn(),
    domElement: global.testUtils.createMockElement('canvas'),
    getContext: jest.fn(() => global.testUtils.createMockWebGLContext())
  })
};

// Console override for cleaner test output
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  warn: jest.fn(),
  error: jest.fn(),
  log: process.env.NODE_ENV === 'test' ? jest.fn() : originalConsole.log
};

// Cleanup after each test
afterEach(() => {
  jest.clearAllMocks();
  document.body.innerHTML = '';
  localStorage.clear();
  sessionStorage.clear();
});

// Global test configuration
beforeAll(() => {
  // Set viewport for consistent testing
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 1024
  });
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: 768
  });
  
  // Mock device pixel ratio
  Object.defineProperty(window, 'devicePixelRatio', {
    writable: true,
    configurable: true,
    value: 1
  });
});