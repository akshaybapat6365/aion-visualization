import * as THREE from 'three';

export const TREE_MOBILE_BREAKPOINT = 720;
export const TREE_COLORS = {
  ROOT_DARK: new THREE.Color('#27424c'),
  TRUNK_BROWN: new THREE.Color('#9b6a3c'),
  BRANCH_GOLD: new THREE.Color('#f0c85e'),
  WATER_GLOW: new THREE.Color('#66e5ff'),
  LAPIS_GOLD: new THREE.Color('#ffd76a'),
  FIGURE_WHITE: new THREE.Color('#f2eee3'),
  MIRROR_CYAN: new THREE.Color('#53d8e8'),
  RUBEDO: new THREE.Color('#c0392b'),
  COSMOS_BLUE: new THREE.Color('#21415b'),
};

export const VOID = 0x030308;
export const THOUSAND_NAMES = 72;
export const OPUS_STAGES = [
  { color: '#050506', y: 1.35, x: 0, scale: 1.08 },
  { color: '#e8e8f0', y: 0, x: 1.35, scale: 0.86 },
  { color: '#ffd76a', y: -1.35, x: 0, scale: 0.96 },
  { color: '#c0392b', y: 0, x: -1.35, scale: 1.02 },
];

export function isTreeMobile(width) {
  return width < TREE_MOBILE_BREAKPOINT;
}

export function getTreePixelRatioCap(width) {
  return isTreeMobile(width) ? 1.35 : 1.8;
}

export function getTreeWaterParticleCount(width) {
  return isTreeMobile(width) ? 220 : 320;
}

export function getTreeCosmicParticleCount(width) {
  return isTreeMobile(width) ? 280 : 420;
}

export function getTreeBloomStrength(width) {
  return isTreeMobile(width) ? 0.92 : 1.08;
}

export function createTreeSceneRandom(seed = 11031) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}
