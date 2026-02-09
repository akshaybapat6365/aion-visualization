export type VizMode = 'guided' | 'explore' | 'reduced-motion';

export interface VizInitContext {
  chapterId?: string;
  conceptId?: string;
  prefersReducedMotion?: boolean;
  onCheckpoint?: (checkpointId: string, complete: boolean) => void;
}

export interface VizCheckpoint {
  id: string;
  label: string;
  complete: boolean;
  notes?: string;
}

export interface VizSummary {
  learningObjective: string;
  completed: number;
  total: number;
  summary: string;
}

export interface VizModuleContract {
  init(context: VizInitContext): Promise<void> | void;
  mount(container: HTMLElement): Promise<void> | void;
  setMode(mode: VizMode): void;
  getCheckpointState(): VizCheckpoint[];
  summarizeLearning(): VizSummary;
  dispose(): void;
}
