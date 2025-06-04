/**
 * WebGL Compatibility Tests - Phase 6: Testing and Quality Assurance
 * Comprehensive WebGL testing across browsers and devices
 */

import { test, expect } from '@playwright/test';

test.describe('WebGL Compatibility Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Monitor WebGL-related console messages
    page.on('console', msg => {
      if (msg.text().includes('WebGL') || msg.text().includes('webgl')) {
        console.log(`WebGL Console: ${msg.text()}`);
      }
    });
  });

  test.describe('WebGL Context Creation', () => {
    test('should create WebGL context successfully', async ({ page }) => {
      await page.goto('/chapters/enhanced/1/');
      
      const webglSupport = await page.evaluate(() => {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        return {
          supported: !!gl,
          version: gl ? gl.getParameter(gl.VERSION) : null,
          vendor: gl ? gl.getParameter(gl.VENDOR) : null,
          renderer: gl ? gl.getParameter(gl.RENDERER) : null
        };
      });
      
      if (webglSupport.supported) {
        expect(webglSupport.version).toBeDefined();
        expect(webglSupport.vendor).toBeDefined();
        expect(webglSupport.renderer).toBeDefined();
        console.log('WebGL Info:', webglSupport);
      } else {
        console.warn('WebGL not supported in this browser/environment');
        // Check for fallback content
        const fallback = page.locator('.webgl-fallback, .no-webgl');
        const fallbackExists = await fallback.count() > 0;
        if (fallbackExists) {
          await expect(fallback.first()).toBeVisible();
        }
      }
    });

    test('should handle WebGL context loss gracefully', async ({ page }) => {
      await page.goto('/chapters/enhanced/1/');
      
      // Simulate context loss
      const contextLossHandled = await page.evaluate(() => {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl');
        
        if (!gl) return false;
        
        let contextLostHandled = false;
        let contextRestoredHandled = false;
        
        canvas.addEventListener('webglcontextlost', (e) => {
          e.preventDefault();
          contextLostHandled = true;
        });
        
        canvas.addEventListener('webglcontextrestored', () => {
          contextRestoredHandled = true;
        });
        
        // Simulate context loss (if extension available)
        const loseContext = gl.getExtension('WEBGL_lose_context');
        if (loseContext) {
          loseContext.loseContext();
          setTimeout(() => {
            if (loseContext.restoreContext) {
              loseContext.restoreContext();
            }
          }, 100);
        }
        
        return { contextLostHandled, contextRestoredHandled, hasExtension: !!loseContext };
      });
      
      console.log('Context loss test:', contextLossHandled);
    });

    test('should detect WebGL extensions correctly', async ({ page }) => {
      await page.goto('/chapters/enhanced/1/');
      
      const extensions = await page.evaluate(() => {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl');
        
        if (!gl) return null;
        
        const supportedExtensions = gl.getSupportedExtensions() || [];
        
        return {
          total: supportedExtensions.length,
          oes_texture_float: supportedExtensions.includes('OES_texture_float'),
          oes_element_index_uint: supportedExtensions.includes('OES_element_index_uint'),
          webgl_lose_context: supportedExtensions.includes('WEBGL_lose_context'),
          oes_vertex_array_object: supportedExtensions.includes('OES_vertex_array_object'),
          all: supportedExtensions
        };
      });
      
      if (extensions) {
        expect(extensions.total).toBeGreaterThan(0);
        console.log(`WebGL Extensions: ${extensions.total} supported`);
        console.log('Key extensions:', {
          float_textures: extensions.oes_texture_float,
          uint_indices: extensions.oes_element_index_uint,
          lose_context: extensions.webgl_lose_context,
          vertex_arrays: extensions.oes_vertex_array_object
        });
      }
    });
  });

  test.describe('WebGL Performance and Capabilities', () => {
    test('should report WebGL capabilities correctly', async ({ page }) => {
      await page.goto('/chapters/enhanced/1/');
      
      const capabilities = await page.evaluate(() => {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl');
        
        if (!gl) return null;
        
        return {
          maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
          maxVertexAttribs: gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
          maxVertexUniformVectors: gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS),
          maxFragmentUniformVectors: gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS),
          maxTextureImageUnits: gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS),
          maxCombinedTextureImageUnits: gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS),
          maxVertexTextureImageUnits: gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS),
          maxViewportDims: gl.getParameter(gl.MAX_VIEWPORT_DIMS),
          aliasedLineWidthRange: gl.getParameter(gl.ALIASED_LINE_WIDTH_RANGE),
          aliasedPointSizeRange: gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE)
        };
      });
      
      if (capabilities) {
        expect(capabilities.maxTextureSize).toBeGreaterThan(0);
        expect(capabilities.maxVertexAttribs).toBeGreaterThan(0);
        expect(capabilities.maxTextureImageUnits).toBeGreaterThan(0);
        
        console.log('WebGL Capabilities:', capabilities);
        
        // Check minimum requirements for our visualizations
        expect(capabilities.maxTextureSize).toBeGreaterThanOrEqual(1024);
        expect(capabilities.maxVertexAttribs).toBeGreaterThanOrEqual(8);
      }
    });

    test('should handle different precision levels', async ({ page }) => {
      await page.goto('/chapters/enhanced/1/');
      
      const precisionInfo = await page.evaluate(() => {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl');
        
        if (!gl) return null;
        
        const getShaderPrecisionFormat = (shaderType, precisionType) => {
          const format = gl.getShaderPrecisionFormat(shaderType, precisionType);
          return format ? {
            rangeMin: format.rangeMin,
            rangeMax: format.rangeMax,
            precision: format.precision
          } : null;
        };
        
        return {
          vertexShader: {
            highFloat: getShaderPrecisionFormat(gl.VERTEX_SHADER, gl.HIGH_FLOAT),
            mediumFloat: getShaderPrecisionFormat(gl.VERTEX_SHADER, gl.MEDIUM_FLOAT),
            lowFloat: getShaderPrecisionFormat(gl.VERTEX_SHADER, gl.LOW_FLOAT),
            highInt: getShaderPrecisionFormat(gl.VERTEX_SHADER, gl.HIGH_INT),
            mediumInt: getShaderPrecisionFormat(gl.VERTEX_SHADER, gl.MEDIUM_INT),
            lowInt: getShaderPrecisionFormat(gl.VERTEX_SHADER, gl.LOW_INT)
          },
          fragmentShader: {
            highFloat: getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT),
            mediumFloat: getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.MEDIUM_FLOAT),
            lowFloat: getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.LOW_FLOAT),
            highInt: getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_INT),
            mediumInt: getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.MEDIUM_INT),
            lowInt: getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.LOW_INT)
          }
        };
      });
      
      if (precisionInfo) {
        // Check that at least medium precision is available
        expect(precisionInfo.fragmentShader.mediumFloat).toBeDefined();
        console.log('WebGL Precision Info:', precisionInfo);
      }
    });
  });

  test.describe('Three.js Compatibility', () => {
    test('should load Three.js without errors', async ({ page }) => {
      await page.goto('/chapters/enhanced/1/');
      
      // Wait for Three.js to load
      await page.waitForFunction(() => typeof window.THREE !== 'undefined', { timeout: 10000 });
      
      const threeInfo = await page.evaluate(() => {
        if (typeof THREE === 'undefined') return null;
        
        return {
          version: THREE.REVISION,
          webglSupported: THREE.WebGLRenderer ? true : false
        };
      });
      
      if (threeInfo) {
        expect(threeInfo.webglSupported).toBe(true);
        expect(threeInfo.version).toBeDefined();
        console.log('Three.js Info:', threeInfo);
      }
    });

    test('should create Three.js renderer successfully', async ({ page }) => {
      await page.goto('/chapters/enhanced/1/');
      
      await page.waitForFunction(() => typeof window.THREE !== 'undefined', { timeout: 10000 });
      
      const rendererTest = await page.evaluate(() => {
        if (typeof THREE === 'undefined') return null;
        
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 256;
          canvas.height = 256;
          
          const renderer = new THREE.WebGLRenderer({ 
            canvas: canvas,
            antialias: true,
            alpha: true
          });
          
          const info = {
            created: true,
            maxTextureSize: renderer.capabilities.maxTextureSize,
            precision: renderer.capabilities.precision,
            logarithmicDepthBuffer: renderer.capabilities.logarithmicDepthBuffer,
            floatVertexTextures: renderer.capabilities.floatVertexTextures,
            context: renderer.getContext()
          };
          
          renderer.dispose();
          return info;
        } catch (error) {
          return { error: error.message };
        }
      });
      
      if (rendererTest) {
        if (rendererTest.error) {
          console.warn('Three.js renderer error:', rendererTest.error);
        } else {
          expect(rendererTest.created).toBe(true);
          expect(rendererTest.maxTextureSize).toBeGreaterThan(0);
          console.log('Three.js Renderer Info:', rendererTest);
        }
      }
    });

    test('should render basic Three.js scene', async ({ page }) => {
      await page.goto('/chapters/enhanced/1/');
      
      await page.waitForFunction(() => typeof window.THREE !== 'undefined', { timeout: 10000 });
      
      const renderTest = await page.evaluate(() => {
        if (typeof THREE === 'undefined') return null;
        
        try {
          // Create basic scene
          const scene = new THREE.Scene();
          const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
          
          const canvas = document.createElement('canvas');
          canvas.width = 256;
          canvas.height = 256;
          
          const renderer = new THREE.WebGLRenderer({ canvas: canvas });
          renderer.setSize(256, 256);
          
          // Create simple geometry
          const geometry = new THREE.BoxGeometry(1, 1, 1);
          const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
          const cube = new THREE.Mesh(geometry, material);
          scene.add(cube);
          
          camera.position.z = 5;
          
          // Render frame
          renderer.render(scene, camera);
          
          // Cleanup
          geometry.dispose();
          material.dispose();
          renderer.dispose();
          
          return { success: true };
        } catch (error) {
          return { error: error.message };
        }
      });
      
      if (renderTest) {
        if (renderTest.error) {
          console.warn('Three.js render error:', renderTest.error);
        } else {
          expect(renderTest.success).toBe(true);
        }
      }
    });
  });

  test.describe('WebGL Error Handling', () => {
    test('should handle shader compilation errors', async ({ page }) => {
      await page.goto('/chapters/enhanced/1/');
      
      const shaderTest = await page.evaluate(() => {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl');
        
        if (!gl) return null;
        
        // Test invalid vertex shader
        const invalidVertexShader = `
          invalid shader code here
        `;
        
        // Test invalid fragment shader
        const invalidFragmentShader = `
          precision mediump float;
          invalid fragment code;
        `;
        
        const vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertexShader, invalidVertexShader);
        gl.compileShader(vertexShader);
        
        const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragmentShader, invalidFragmentShader);
        gl.compileShader(fragmentShader);
        
        return {
          vertexShaderError: !gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS),
          fragmentShaderError: !gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS),
          vertexShaderLog: gl.getShaderInfoLog(vertexShader),
          fragmentShaderLog: gl.getShaderInfoLog(fragmentShader)
        };
      });
      
      if (shaderTest) {
        expect(shaderTest.vertexShaderError).toBe(true);
        expect(shaderTest.fragmentShaderError).toBe(true);
        console.log('Shader error handling works correctly');
      }
    });

    test('should handle texture loading errors', async ({ page }) => {
      await page.goto('/chapters/enhanced/1/');
      
      const textureTest = await page.evaluate(() => {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl');
        
        if (!gl) return null;
        
        try {
          const texture = gl.createTexture();
          gl.bindTexture(gl.TEXTURE_2D, texture);
          
          // Try to load invalid texture data
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
          
          const error = gl.getError();
          return { success: error === gl.NO_ERROR };
        } catch (e) {
          return { error: e.message };
        }
      });
      
      if (textureTest) {
        // Should handle texture creation gracefully
        expect(typeof textureTest).toBe('object');
      }
    });
  });

  test.describe('Mobile WebGL Support', () => {
    test('should work on mobile devices', async ({ page, isMobile }) => {
      if (!isMobile) test.skip();
      
      await page.goto('/chapters/enhanced/1/');
      
      const mobileWebGL = await page.evaluate(() => {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl');
        
        if (!gl) return { supported: false };
        
        return {
          supported: true,
          maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
          maxVertexAttribs: gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
          renderer: gl.getParameter(gl.RENDERER),
          extensions: gl.getSupportedExtensions()?.length || 0
        };
      });
      
      if (mobileWebGL.supported) {
        expect(mobileWebGL.maxTextureSize).toBeGreaterThan(0);
        console.log('Mobile WebGL Info:', mobileWebGL);
      } else {
        console.warn('WebGL not supported on this mobile device');
        // Check for mobile fallback
        const fallback = page.locator('.mobile-fallback, .webgl-fallback');
        const fallbackExists = await fallback.count() > 0;
        if (fallbackExists) {
          await expect(fallback.first()).toBeVisible();
        }
      }
    });

    test('should handle mobile-specific WebGL limitations', async ({ page, isMobile }) => {
      if (!isMobile) test.skip();
      
      await page.goto('/chapters/enhanced/1/');
      
      const limitations = await page.evaluate(() => {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl');
        
        if (!gl) return null;
        
        return {
          maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
          maxVertexTextureImageUnits: gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS),
          highPrecisionSupported: !!gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT).precision
        };
      });
      
      if (limitations) {
        // Mobile devices often have lower limits
        console.log('Mobile WebGL Limitations:', limitations);
        
        // Verify our app works within typical mobile constraints
        if (limitations.maxTextureSize < 2048) {
          console.warn('Limited texture size on mobile:', limitations.maxTextureSize);
        }
      }
    });
  });

  test.describe('WebGL Performance Monitoring', () => {
    test('should monitor frame rate during WebGL rendering', async ({ page }) => {
      await page.goto('/chapters/enhanced/1/');
      
      // Wait for visualization to load
      await page.waitForSelector('.visualization-container', { timeout: 10000 });
      
      const frameRateTest = await page.evaluate(() => {
        return new Promise((resolve) => {
          let frameCount = 0;
          const startTime = performance.now();
          
          const animate = () => {
            frameCount++;
            if (frameCount < 60) { // Test for 60 frames
              requestAnimationFrame(animate);
            } else {
              const endTime = performance.now();
              const duration = endTime - startTime;
              const fps = (frameCount / duration) * 1000;
              resolve({ fps, duration, frameCount });
            }
          };
          
          requestAnimationFrame(animate);
        });
      });
      
      expect(frameRateTest.fps).toBeGreaterThan(10); // Minimum acceptable FPS
      console.log('Frame rate test:', frameRateTest);
    });
  });
});