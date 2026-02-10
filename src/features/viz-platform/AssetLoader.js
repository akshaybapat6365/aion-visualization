/**
 * AssetLoader.js
 * Utility for preloading assets to ensure smooth visualization initialization.
 */

class AssetLoader {
    constructor() {
        this.cache = new Map();
    }

    loadImage(src) {
        if (this.cache.has(src)) {
            return Promise.resolve(this.cache.get(src));
        }

        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.cache.set(src, img);
                resolve(img);
            };
            img.onerror = (err) => reject(new Error(`Failed to load image: ${src}`));
            img.crossOrigin = 'Anonymous';
            img.src = src;
        });
    }

    async loadFont(family, src) {
        // Basic font loading via FontFace API
        try {
            const font = new FontFace(family, `url(${src})`);
            await font.load();
            document.fonts.add(font);
        } catch (err) {
            console.warn(`[AssetLoader] Failed to load font ${family}:`, err);
        }
    }

    loadAllImages(urls) {
        return Promise.all(urls.map(url => this.loadImage(url)));
    }

    clear() {
        this.cache.clear();
    }
}

export const assetLoader = new AssetLoader();
export default AssetLoader;
