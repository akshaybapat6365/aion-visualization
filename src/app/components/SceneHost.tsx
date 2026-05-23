import { useEffect, useRef, useState } from 'react';

import { SCENE_LOADERS } from '../visualization/chapterScenes';
import type { ChapterExperience, ChapterId, ChapterRecord } from '../types';

interface SceneInstance {
  mount?: () => Promise<void> | void;
  setPanelState?: (state: { activePanelId: string; progress: number }) => void;
  setReducedMotion?: (enabled: boolean) => void;
  dispose?: () => void;
}

export default function SceneHost({
  chapter,
  experience,
  reducedMotion = false,
  activePanelId,
  panelProgress = 0,
}: {
  chapter: ChapterRecord;
  experience: ChapterExperience;
  reducedMotion?: boolean;
  activePanelId?: string;
  panelProgress?: number;
}) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const instanceRef = useRef<SceneInstance | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'fallback'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let disposed = false;
    let instance: SceneInstance | null = null;
    const mountNode = mountRef.current;
    if (!mountNode) return undefined;

    mountNode.innerHTML = '';
    instanceRef.current = null;
    setState('loading');
    setMessage('');

    if (reducedMotion) {
      setState('fallback');
      setMessage(experience.fallbackSummary);
      return undefined;
    }

    async function loadScene() {
      try {
        const loader = SCENE_LOADERS[chapter.id as ChapterId];
        const module = (await loader()) as { default?: new (container: HTMLElement) => SceneInstance };
        if (disposed || !module.default || !mountNode) return;
        instance = new module.default(mountNode);
        instanceRef.current = instance;
        if (typeof instance.mount === 'function') {
          await instance.mount();
        }
        instance.setReducedMotion?.(reducedMotion);
        instance.setPanelState?.({ activePanelId: activePanelId || experience.panels[0]?.id || '', progress: panelProgress });
        if (!disposed) setState('ready');
      } catch (error) {
        if (!disposed) {
          setState('fallback');
          setMessage(error instanceof Error ? error.message : experience.fallbackSummary);
        }
      }
    }

    loadScene();

    return () => {
      disposed = true;
      if (instance?.dispose) instance.dispose();
      instanceRef.current = null;
      if (mountNode) mountNode.innerHTML = '';
    };
  }, [chapter.id, experience, reducedMotion]);

  useEffect(() => {
    if (state !== 'ready') return;
    instanceRef.current?.setReducedMotion?.(reducedMotion);
    instanceRef.current?.setPanelState?.({
      activePanelId: activePanelId || experience.panels[0]?.id || '',
      progress: panelProgress,
    });
  }, [activePanelId, experience.panels, panelProgress, reducedMotion, state]);

  return (
    <section className="scene-host" aria-label={`${chapter.title} visualization`}>
      <div ref={mountRef} className="scene-host__mount" data-state={state} />
      {state === 'loading' && (
        <div className="scene-host__status" role="status">
          <span>Aion</span>
          <strong>{chapter.title}</strong>
        </div>
      )}
      {state === 'fallback' && (
        <div className="scene-host__fallback" role="note">
          <p className="eyebrow">Fallback view</p>
          <h2>{chapter.title}</h2>
          <p>{message || experience.fallbackSummary}</p>
        </div>
      )}
    </section>
  );
}
