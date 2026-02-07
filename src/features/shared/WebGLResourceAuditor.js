export class WebGLResourceAuditor {
  constructor(scope) {
    this.scope = scope;
    this.resources = [];
  }

  track(resource, label, type = 'resource') {
    if (!resource || typeof resource.dispose !== 'function') {
      return resource;
    }

    this.resources.push({
      resource,
      label,
      type,
      disposed: false
    });

    return resource;
  }

  dispose(resource) {
    this.resources.forEach(entry => {
      if (entry.resource === resource && !entry.disposed) {
        entry.resource.dispose();
        entry.disposed = true;
      }
    });
  }

  disposeAll() {
    this.resources.forEach(entry => {
      if (!entry.disposed) {
        entry.resource.dispose();
        entry.disposed = true;
      }
    });
  }

  report() {
    const leaked = this.resources
      .filter(entry => !entry.disposed)
      .map(entry => ({ label: entry.label, type: entry.type }));

    return {
      scope: this.scope,
      totalTracked: this.resources.length,
      disposed: this.resources.length - leaked.length,
      leaked
    };
  }
}
