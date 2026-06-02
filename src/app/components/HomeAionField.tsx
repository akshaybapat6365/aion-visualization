import { useEffect, useRef, useState } from 'react';

import type { ChapterRecord } from '../types';

function useReducedMotionPreference() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => setPrefersReducedMotion(event.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
}

export default function HomeAionField({ chapters }: { chapters: ChapterRecord[] }) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const prefersReducedMotion = useReducedMotionPreference();

  useEffect(() => {
    if (prefersReducedMotion) return undefined;

    let disposed = false;
    let frameId = 0;
    let cleanup = () => {};

    async function mountField() {
      const mount = mountRef.current;
      if (!mount) return;

      const THREE = await import('three');
      if (disposed || !mountRef.current) return;

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      mount.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 120);
      camera.position.set(0, 0, 22);

      const root = new THREE.Group();
      root.position.x = 2.8;
      scene.add(root);

      const gold = new THREE.Color('#d4af37');
      const cyan = new THREE.Color('#53d8e8');
      const rose = new THREE.Color('#cc6d86');
      const white = new THREE.Color('#f4f0e8');
      const pointer = new THREE.Vector2(0, 0);
      const pointerSmooth = new THREE.Vector2(0, 0);

      const makeLineLoop = (radius: number, color: THREE.Color, opacity: number, segments = 192) => {
        const points = [];
        for (let i = 0; i <= segments; i += 1) {
          const angle = (i / segments) * Math.PI * 2;
          points.push(new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, 0));
        }
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending });
        return new THREE.Line(geometry, material);
      };

      const orbitOuter = makeLineLoop(7.9, gold, 0.18);
      const orbitMiddle = makeLineLoop(5.6, white, 0.08);
      const orbitInner = makeLineLoop(3.3, cyan, 0.18);
      root.add(orbitOuter, orbitMiddle, orbitInner);

      const coreGeometry = new THREE.IcosahedronGeometry(0.82, 3);
      const coreMaterial = new THREE.MeshStandardMaterial({
        color: '#f4f0e8',
        emissive: '#d4af37',
        emissiveIntensity: 1.55,
        roughness: 0.28,
        metalness: 0.15,
      });
      const core = new THREE.Mesh(coreGeometry, coreMaterial);
      root.add(core);

      const veil = new THREE.Mesh(
        new THREE.SphereGeometry(2.5, 48, 32),
        new THREE.MeshBasicMaterial({
          color: '#d4af37',
          transparent: true,
          opacity: 0.08,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      );
      root.add(veil);

      const chapterNodes = chapters.map((chapter) => {
        const angle = ((chapter.order - 1) / chapters.length) * Math.PI * 2 - Math.PI / 2;
        const radius = chapter.order === 1 || chapter.order === 14 ? 8.15 : 7.55;
        const color = chapter.order < 5 ? cyan : chapter.order < 10 ? gold : chapter.order < 14 ? rose : white;
        const node = new THREE.Mesh(
          new THREE.SphereGeometry(chapter.order === 1 || chapter.order === 14 ? 0.2 : 0.14, 18, 12),
          new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.92, blending: THREE.AdditiveBlending }),
        );
        node.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, 0);

        const threadGeometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, -0.08), node.position.clone()]);
        const thread = new THREE.Line(
          threadGeometry,
          new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending }),
        );

        const halo = makeLineLoop(chapter.order === 1 || chapter.order === 14 ? 0.48 : 0.34, color, 0.24, 48);
        halo.position.copy(node.position);
        halo.lookAt(camera.position);

        root.add(thread, halo, node);
        return { angle, chapter, color, halo, node, radius, thread };
      });

      const starCount = 900;
      const starPositions = new Float32Array(starCount * 3);
      const starColors = new Float32Array(starCount * 3);
      for (let i = 0; i < starCount; i += 1) {
        const distance = 9 + Math.random() * 42;
        const angle = Math.random() * Math.PI * 2;
        const height = (Math.random() - 0.5) * 22;
        starPositions[i * 3] = Math.cos(angle) * distance;
        starPositions[i * 3 + 1] = height;
        starPositions[i * 3 + 2] = -18 + Math.sin(angle) * distance;
        const mix = Math.random();
        const color = mix > 0.76 ? cyan : mix > 0.54 ? gold : white;
        starColors[i * 3] = color.r;
        starColors[i * 3 + 1] = color.g;
        starColors[i * 3 + 2] = color.b;
      }

      const stars = new THREE.Points(
        new THREE.BufferGeometry()
          .setAttribute('position', new THREE.BufferAttribute(starPositions, 3))
          .setAttribute('color', new THREE.BufferAttribute(starColors, 3)),
        new THREE.PointsMaterial({
          vertexColors: true,
          size: 0.055,
          transparent: true,
          opacity: 0.54,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          sizeAttenuation: true,
        }),
      );
      scene.add(stars);

      scene.add(new THREE.AmbientLight(0x1a1a24, 0.9));
      const key = new THREE.PointLight(0xd4af37, 18, 30);
      key.position.set(0, 0, 5);
      root.add(key);
      const rim = new THREE.PointLight(0x53d8e8, 8, 26);
      rim.position.set(-5, 3, 4);
      root.add(rim);

      const resize = () => {
        const rect = mount.getBoundingClientRect();
        const width = Math.max(1, rect.width);
        const height = Math.max(1, rect.height);
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      };

      const onPointerMove = (event: PointerEvent) => {
        const rect = mount.getBoundingClientRect();
        pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
      };

      const render = (time: number) => {
        pointerSmooth.lerp(pointer, 0.055);
        const t = time * 0.001;

        root.rotation.x = pointerSmooth.y * 0.08;
        root.rotation.y = pointerSmooth.x * 0.18 + Math.sin(t * 0.08) * 0.035;
        stars.rotation.y = t * 0.012;
        stars.rotation.x = pointerSmooth.y * 0.03;
        core.rotation.x = t * 0.18;
        core.rotation.y = t * 0.28;
        veil.scale.setScalar(1 + Math.sin(t * 0.9) * 0.06);

        for (const item of chapterNodes) {
          const pulse = (Math.sin(t * 1.2 + item.chapter.order * 0.7) + 1) * 0.5;
          item.node.scale.setScalar(1 + pulse * 0.45);
          item.halo.scale.setScalar(1 + pulse * 0.28);
          const material = item.thread.material as THREE.LineBasicMaterial;
          material.opacity = item.chapter.order === 1 ? 0.32 : 0.1 + pulse * 0.08;
        }

        renderer.render(scene, camera);
        frameId = window.requestAnimationFrame(render);
      };

      resize();
      window.addEventListener('resize', resize);
      mount.addEventListener('pointermove', onPointerMove);
      render(0);

      cleanup = () => {
        window.removeEventListener('resize', resize);
        mount.removeEventListener('pointermove', onPointerMove);
        window.cancelAnimationFrame(frameId);
        scene.traverse((object) => {
          const mesh = object as THREE.Mesh;
          mesh.geometry?.dispose();
          const material = mesh.material;
          if (Array.isArray(material)) {
            material.forEach((item) => item.dispose());
          } else {
            material?.dispose();
          }
        });
        renderer.dispose();
        renderer.domElement.remove();
      };
    }

    mountField();

    return () => {
      disposed = true;
      cleanup();
    };
  }, [chapters, prefersReducedMotion]);

  if (prefersReducedMotion) {
    return (
      <div
        className="home-aion-field home-aion-field--static"
        role="img"
        aria-label="Static Aion field connecting ego, shadow, fish, alchemy, and Self across fourteen chapters."
      >
        <div className="home-aion-field__static" aria-hidden="true">
          <span className="home-aion-field__static-ring home-aion-field__static-ring--outer" />
          <span className="home-aion-field__static-ring home-aion-field__static-ring--middle" />
          <span className="home-aion-field__static-ring home-aion-field__static-ring--inner" />
          <span className="home-aion-field__static-core" />
          {chapters.map((chapter) => (
            <span
              key={chapter.id}
              className="home-aion-field__static-node"
              style={{ ['--node-index' as string]: chapter.order - 1, ['--node-count' as string]: chapters.length }}
            />
          ))}
        </div>
        <div className="home-aion-field__caption">
          <span>ego</span>
          <span>shadow</span>
          <span>fish</span>
          <span>alchemy</span>
          <span>self</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="home-aion-field"
      role="img"
      aria-label="Animated Aion constellation connecting ego, shadow, fish, alchemy, and Self across fourteen chapters."
    >
      <div ref={mountRef} className="home-aion-field__mount" />
      <div className="home-aion-field__caption">
        <span>ego</span>
        <span>shadow</span>
        <span>fish</span>
        <span>alchemy</span>
        <span>self</span>
      </div>
    </div>
  );
}
