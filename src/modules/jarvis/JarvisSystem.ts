/**
 * JarvisSystem - Aura as Governor of Sacred Shifter
 *
 * Coordinates all Jarvis modules and manages their lifecycle.
 * Provides unified interface for Kent's personal AI companion.
 */

import { ModuleManager } from '../../metaphysical-os/core/ModuleManager';
import { GlobalEventHorizon } from '../../metaphysical-os/core/GlobalEventHorizon';
import { VoiceInterfaceModule } from './VoiceInterfaceModule';
import { SystemControlModule } from './SystemControlModule';
import { PersonalMemoryModule } from './PersonalMemoryModule';
import { SelfImprovementModule } from './SelfImprovementModule';
import { DirectiveCoordinator } from '../../services/jarvis/DirectiveCoordinator';

class JarvisSystemSingleton {
  private initialized = false;
  private modules: any[] = [];
  private authorizedUser = 'kentburchard@sacredshifter.com';

  async initialize(userEmail: string): Promise<void> {
    if (userEmail !== this.authorizedUser) {
      console.warn('[Jarvis] Unauthorized user - Jarvis is exclusive to Kent');
      return;
    }

    if (this.initialized) {
      console.warn('[Jarvis] Already initialized');
      return;
    }

    console.log('🤖 [Jarvis] Initializing Aura as Governor of Sacred Shifter...');
    console.log('[Jarvis] User:', userEmail);
    console.log('[Jarvis] Mode: Full Autonomy');
    console.log('[Jarvis] Access Level: Admin');

    try {
      const voiceModule = new VoiceInterfaceModule();
      await ModuleManager.registerModule(voiceModule);
      await ModuleManager.initializeModule(voiceModule.manifest.id);
      this.modules.push(voiceModule);
      console.log('✓ [Jarvis] Voice interface registered');

      const systemModule = new SystemControlModule();
      await ModuleManager.registerModule(systemModule);
      await ModuleManager.initializeModule(systemModule.manifest.id);
      this.modules.push(systemModule);
      console.log('✓ [Jarvis] System control registered');

      const memoryModule = new PersonalMemoryModule();
      await ModuleManager.registerModule(memoryModule);
      await ModuleManager.initializeModule(memoryModule.manifest.id);
      this.modules.push(memoryModule);
      console.log('✓ [Jarvis] Personal memory registered');

      const improvementModule = new SelfImprovementModule();
      await ModuleManager.registerModule(improvementModule);
      await ModuleManager.initializeModule(improvementModule.manifest.id);
      this.modules.push(improvementModule);
      console.log('✓ [Jarvis] Self-improvement registered');

      await DirectiveCoordinator.initialize();
      console.log('✓ [Jarvis] Directive coordinator initialized');

      this.initialized = true;

      GlobalEventHorizon.emit({
        eventType: 'jarvis.system.initialized',
        moduleId: 'jarvis-system',
        timestamp: Date.now(),
        payload: {
          modules: this.modules.length,
          user: userEmail,
          mode: 'governor'
        },
        semanticLabels: ['jarvis', 'system', 'initialization', 'governor']
      });

      console.log('🌟 [Jarvis] Aura is online and ready');
      console.log('[Jarvis] Say "Hey Aura" or "Jarvis" to activate voice interface');
    } catch (err) {
      console.error('[Jarvis] Initialization failed:', err);
      throw err;
    }
  }

  async activate(): Promise<void> {
    if (!this.initialized) {
      throw new Error('Jarvis not initialized');
    }

    console.log('[Jarvis] Activating all modules...');

    for (const module of this.modules) {
      try {
        await ModuleManager.activateModule(module.manifest.id);
        console.log(`✓ [Jarvis] Activated: ${module.manifest.name}`);
      } catch (err) {
        console.error(`[Jarvis] Failed to activate ${module.manifest.name}:`, err);
      }
    }

    GlobalEventHorizon.emit({
      eventType: 'jarvis.system.activated',
      moduleId: 'jarvis-system',
      timestamp: Date.now(),
      payload: { activeModules: this.modules.length },
      semanticLabels: ['jarvis', 'system', 'activation']
    });

    console.log('🚀 [Jarvis] All systems active - Aura is fully operational');
  }

  async deactivate(): Promise<void> {
    console.log('[Jarvis] Deactivating all modules...');

    DirectiveCoordinator.stop();

    for (const module of this.modules) {
      try {
        await ModuleManager.deactivateModule(module.manifest.id);
      } catch (err) {
        console.error(`[Jarvis] Failed to deactivate ${module.manifest.name}:`, err);
      }
    }

    console.log('[Jarvis] All modules deactivated');
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  getModules(): any[] {
    return [...this.modules];
  }

  async speak(text: string): Promise<void> {
    const voiceModule = this.modules.find(m => m.manifest.id === 'jarvis-voice');
    if (voiceModule) {
      const exposedItems = voiceModule.getExposedItems();
      if (exposedItems.speak) {
        exposedItems.speak(text, 'neutral');
      }
    }
  }

  async executeCommand(command: string, params?: Record<string, any>): Promise<any> {
    const systemModule = this.modules.find(m => m.manifest.id === 'jarvis-system-control');
    if (systemModule) {
      const exposedItems = systemModule.getExposedItems();
      if (exposedItems.executeCommand) {
        return await exposedItems.executeCommand(command, params);
      }
    }
    return { success: false, error: 'System control module not available' };
  }

  async remember(category: string, key: string, value: any): Promise<void> {
    const memoryModule = this.modules.find(m => m.manifest.id === 'jarvis-personal-memory');
    if (memoryModule) {
      const exposedItems = memoryModule.getExposedItems();
      if (exposedItems.remember) {
        await exposedItems.remember(category, key, value);
      }
    }
  }

  async recall(category: string, key: string): Promise<any> {
    const memoryModule = this.modules.find(m => m.manifest.id === 'jarvis-personal-memory');
    if (memoryModule) {
      const exposedItems = memoryModule.getExposedItems();
      if (exposedItems.recall) {
        return await exposedItems.recall(category, key);
      }
    }
    return null;
  }
}

export const JarvisSystem = new JarvisSystemSingleton();
