import { IModule, ModuleState } from '../types/IModule';
import { GlobalEventHorizon } from './GlobalEventHorizon';

interface ModuleEntry {
  module: IModule;
  state: ModuleState;
}

class ModuleManagerSingleton {
  private modules: Map<string, ModuleEntry> = new Map();

  async registerModule(module: IModule): Promise<void> {
    const moduleId = module.manifest.id;

    if (this.modules.has(moduleId)) {
      throw new Error(`Module ${moduleId} is already registered`);
    }

    const integrityScore = this.calculateIntegrityScore(module);
    if (integrityScore < 0.7) {
      console.warn(`Module ${moduleId} has low integrity score: ${integrityScore}`);
    }

    this.modules.set(moduleId, {
      module,
      state: 'uninitialized'
    });

    GlobalEventHorizon.emit({
      eventType: 'module.registered',
      moduleId: 'module-manager',
      timestamp: Date.now(),
      payload: { moduleId, manifest: module.manifest },
      semanticLabels: ['system', 'module-lifecycle']
    });
  }

  async initializeModule(moduleId: string): Promise<void> {
    const entry = this.modules.get(moduleId);
    if (!entry) {
      throw new Error(`Module ${moduleId} not found`);
    }

    if (entry.state !== 'uninitialized') {
      console.warn(`Module ${moduleId} is already initialized`);
      return;
    }

    await entry.module.initialize();
    entry.state = 'initialized';

    GlobalEventHorizon.emit({
      eventType: 'module.initialized',
      moduleId: 'module-manager',
      timestamp: Date.now(),
      payload: { moduleId },
      semanticLabels: ['system', 'module-lifecycle']
    });
  }

  async activateModule(moduleId: string): Promise<void> {
    const entry = this.modules.get(moduleId);
    if (!entry) {
      throw new Error(`Module ${moduleId} not found`);
    }

    if (entry.state === 'uninitialized') {
      await this.initializeModule(moduleId);
    }

    if (entry.state === 'active') {
      console.warn(`Module ${moduleId} is already active`);
      return;
    }

    await entry.module.activate();
    entry.state = 'active';

    GlobalEventHorizon.emit({
      eventType: 'module.activated',
      moduleId: 'module-manager',
      timestamp: Date.now(),
      payload: { moduleId },
      semanticLabels: ['system', 'module-lifecycle']
    });
  }

  async deactivateModule(moduleId: string): Promise<void> {
    const entry = this.modules.get(moduleId);
    if (!entry) {
      throw new Error(`Module ${moduleId} not found`);
    }

    if (entry.state !== 'active') {
      console.warn(`Module ${moduleId} is not active`);
      return;
    }

    await entry.module.deactivate();
    entry.state = 'suspended';

    GlobalEventHorizon.emit({
      eventType: 'module.deactivated',
      moduleId: 'module-manager',
      timestamp: Date.now(),
      payload: { moduleId },
      semanticLabels: ['system', 'module-lifecycle']
    });
  }

  async destroyModule(moduleId: string): Promise<void> {
    const entry = this.modules.get(moduleId);
    if (!entry) {
      throw new Error(`Module ${moduleId} not found`);
    }

    if (entry.state === 'active') {
      await this.deactivateModule(moduleId);
    }

    await entry.module.destroy();
    entry.state = 'destroyed';
    this.modules.delete(moduleId);

    GlobalEventHorizon.emit({
      eventType: 'module.destroyed',
      moduleId: 'module-manager',
      timestamp: Date.now(),
      payload: { moduleId },
      semanticLabels: ['system', 'module-lifecycle']
    });
  }

  getModule(moduleId: string): IModule | null {
    return this.modules.get(moduleId)?.module || null;
  }

  getModuleState(moduleId: string): ModuleState | null {
    return this.modules.get(moduleId)?.state || null;
  }

  getExposedModuleItem(moduleId: string, itemName: string): any {
    const module = this.getModule(moduleId);
    if (!module) {
      throw new Error(`Module ${moduleId} not found`);
    }

    const exposedItems = module.getExposedItems();
    return exposedItems[itemName];
  }

  listModules(): Array<{ id: string; state: ModuleState }> {
    return Array.from(this.modules.entries()).map(([id, entry]) => ({
      id,
      state: entry.state
    }));
  }

  private calculateIntegrityScore(module: IModule): number {
    let score = 1.0;

    if (!module.manifest.essenceLabels || module.manifest.essenceLabels.length === 0) {
      score -= 0.2;
    }

    if (!module.manifest.capabilities || module.manifest.capabilities.length === 0) {
      score -= 0.2;
    }

    if (!module.manifest.telosAlignment || module.manifest.telosAlignment.length === 0) {
      score -= 0.1;
    }

    return Math.max(0, score);
  }
}

export const ModuleManager = new ModuleManagerSingleton();
