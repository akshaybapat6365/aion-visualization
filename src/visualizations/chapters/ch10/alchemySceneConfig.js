import * as THREE from 'three';

export const ALCHEMY_COLORS = {
    NIGREDO_BLACK: new THREE.Color('#0a0a0a'),
    ALBEDO_WHITE: new THREE.Color('#e8e8f0'),
    CITRINITAS: new THREE.Color('#ffd700'),
    RUBEDO_RED: new THREE.Color('#c0392b'),
    ECHENEIS_CYAN: new THREE.Color('#22d3ee'),
    SHIP_GREY: new THREE.Color('#3a3a4a'),
    MAGNET_TEAL: new THREE.Color('#2f6674'),
    LAPIS_GOLD: new THREE.Color('#d4af37'),
    FIRE_ORANGE: new THREE.Color('#ff8a3d'),
    YOKE_BROWN: new THREE.Color('#8b6914'),
};

export const VOID = 0x030308;
export const ALCHEMY_MOBILE_BREAKPOINT = 720;
export const DESKTOP_MAGNET_PARTICLES = 260;
export const MOBILE_MAGNET_PARTICLES = 170;

export function isAlchemyMobile(width) {
    return width < ALCHEMY_MOBILE_BREAKPOINT;
}

export function getAlchemyPixelRatioCap(width) {
    return isAlchemyMobile(width) ? 1.5 : 2;
}

export function getAlchemyMagnetParticleCount(width) {
    return isAlchemyMobile(width) ? MOBILE_MAGNET_PARTICLES : DESKTOP_MAGNET_PARTICLES;
}

export function getAlchemyBloomStrength(width) {
    return isAlchemyMobile(width) ? 0.88 : 1.08;
}
