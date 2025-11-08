export interface ModuleManifest {
  id: string;
  name: string;
  version: string;
  author?: string;
  essenceLabels: string[];
  capabilities: string[];
  telosAlignment: string[];
  dependencies: string[];
  resourceFootprintMB: number;
  priority: number;
  integrityScore?: number;
}

export interface IModule {
  manifest: ModuleManifest;

  initialize(): Promise<void>;
  activate(): Promise<void>;
  deactivate(): Promise<void>;
  destroy(): Promise<void>;

  getExposedItems(): Record<string, any>;
}

export type ModuleState = 'uninitialized' | 'initialized' | 'active' | 'suspended' | 'destroyed';
