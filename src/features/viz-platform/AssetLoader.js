import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

class AssetLoader {
    constructor() {
        this.textureLoader = new THREE.TextureLoader();
        this.gltfLoader = new GLTFLoader();
        this.fileLoader = new THREE.FileLoader(); // Good for shaders/text

        this.cache = new Map();
        this.activeLoads = new Map();
    }

    /**
     * Load a texture with caching and promise wrapper
     * @param {string} url 
     * @returns {Promise<THREE.Texture>}
     */
    async loadTexture(url) {
        if (this.cache.has(url)) return this.cache.get(url);

        return new Promise((resolve, reject) => {
            this.textureLoader.load(
                url,
                (texture) => {
                    this.cache.set(url, texture);
                    resolve(texture);
                },
                undefined,
                (err) => reject(new Error(`Failed to load texture: ${url} - ${err.message}`))
            );
        });
    }

    /**
     * Load a GLTF/GLB model
     * @param {string} url 
     * @returns {Promise<Object>} The GLTF result (scene, animations, etc.)
     */
    async loadGLTF(url) {
        if (this.cache.has(url)) return this.cache.get(url);

        return new Promise((resolve, reject) => {
            this.gltfLoader.load(
                url,
                (gltf) => {
                    this.cache.set(url, gltf);
                    resolve(gltf);
                },
                undefined,
                (err) => reject(new Error(`Failed to load GLTF: ${url} - ${err.message}`))
            );
        });
    }

    /**
     * Load a raw text file (e.g. shader source)
     * @param {string} url 
     * @returns {Promise<string>}
     */
    async loadShader(url) {
        if (this.cache.has(url)) return this.cache.get(url);

        return new Promise((resolve, reject) => {
            this.fileLoader.load(
                url,
                (text) => {
                    this.cache.set(url, text);
                    resolve(text);
                },
                undefined,
                (err) => reject(new Error(`Failed to load shader: ${url} - ${err.message}`))
            );
        });
    }

    /**
     * Load a generic image (HTMLImageElement)
     * @param {string} src 
     * @returns {Promise<HTMLImageElement>}
     */
    async loadImage(src) {
        if (this.cache.has(src)) return this.cache.get(src);

        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.cache.set(src, img);
                resolve(img);
            };
            img.onerror = (e) => reject(new Error(`Failed to load image: ${src}`));
            img.src = src;
        });
    }

    /**
     * Preload a list of assets for a chapter
     * @param {Array<{type: 'texture'|'model'|'shader'|'image', url: string}>} assets 
     * @param {(progress: number, loaded: number, total: number) => void} onProgress 
     */
    async loadManifest(assets, onProgress = () => { }) {
        const total = assets.length;
        let loaded = 0;

        // If nothing to load, complete immediately
        if (total === 0) {
            onProgress(1.0, 0, 0);
            return [];
        }

        const promises = assets.map(async (asset) => {
            try {
                let result;
                switch (asset.type) {
                    case 'texture': result = await this.loadTexture(asset.url); break;
                    case 'model': result = await this.loadGLTF(asset.url); break;
                    case 'shader': result = await this.loadShader(asset.url); break;
                    case 'image': result = await this.loadImage(asset.url); break;
                    default:
                        console.warn(`Unknown asset type: ${asset.type}`);
                        result = null;
                }

                loaded++;
                const pct = loaded / total;
                onProgress(pct, loaded, total);
                return result;
            } catch (err) {
                console.error(`Error loading asset ${asset.url}:`, err);
                loaded++; // Count as processed even if failed to avoid stall
                onProgress(loaded / total, loaded, total);
                return null;
            }
        });

        return Promise.all(promises);
    }
}

export const assetLoader = new AssetLoader();
