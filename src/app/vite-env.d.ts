/// <reference types="vite/client" />

declare module '../visualizations/**/*.js' {
  const VizClass: new (container: HTMLElement, options?: Record<string, unknown>) => {
    mount?: () => Promise<void> | void;
    dispose?: () => void;
  };
  export default VizClass;
}

declare module '../../visualizations/**/*.js' {
  const VizClass: new (container: HTMLElement, options?: Record<string, unknown>) => {
    mount?: () => Promise<void> | void;
    dispose?: () => void;
  };
  export default VizClass;
}

declare module '../../features/timeline/timeline-data.js' {
  export const TIMELINE_CATEGORIES: Array<{ id: string; label: string }>;
  export const TIMELINE_EVENTS: Array<{
    id: string;
    date: string;
    title: string;
    category: string;
    summary: string;
  }>;
}
