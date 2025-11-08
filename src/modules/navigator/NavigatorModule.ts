import { IModule, ModuleManifest, ModuleState } from '../../metaphysical-os/types/IModule';
import { GlobalEventHorizon } from '../../metaphysical-os/core/GlobalEventHorizon';
import { LabelProcessor } from '../../metaphysical-os/core/LabelProcessor';
import { EventSubscription } from '../../metaphysical-os/types/GESemanticEvent';
import manifestData from './navigator.manifest.json';
import { AssessmentEngine } from './services/AssessmentEngine';
import { RoutingEngine } from './services/RoutingEngine';
import { SafetyMonitor } from './services/SafetyMonitor';
import type { ChemicalState, RegulationLevel, NavigatorProfile } from '../../types/navigator';

export class NavigatorModule implements IModule {
  manifest: ModuleManifest;
  private state: ModuleState = 'uninitialized';
  private subscriptions: EventSubscription[] = [];
  private assessmentEngine: AssessmentEngine;
  private routingEngine: RoutingEngine;
  private safetyMonitor: SafetyMonitor;

  private currentProfile: NavigatorProfile | null = null;
  private currentChemicalState: ChemicalState = 'unknown';
  private currentRegulationLevel: RegulationLevel = 'medium';

  constructor() {
    this.manifest = manifestData as ModuleManifest;
    this.assessmentEngine = new AssessmentEngine();
    this.routingEngine = new RoutingEngine();
    this.safetyMonitor = new SafetyMonitor();
  }

  async initialize(): Promise<void> {
    if (this.state !== 'uninitialized') {
      console.warn('NavigatorModule already initialized');
      return;
    }

    LabelProcessor.registerLabels('navigator-engine', this.manifest.essenceLabels);

    await this.assessmentEngine.initialize();
    await this.routingEngine.initialize();

    this.setupEventSubscriptions();

    this.state = 'initialized';

    GlobalEventHorizon.emit({
      eventType: 'navigator.initialized',
      moduleId: this.manifest.id,
      timestamp: Date.now(),
      payload: { manifest: this.manifest },
      semanticLabels: ['system', 'initialization', 'navigator']
    });
  }

  async activate(): Promise<void> {
    if (this.state !== 'initialized' && this.state !== 'suspended') {
      console.warn('NavigatorModule must be initialized before activation');
      return;
    }

    this.state = 'active';

    GlobalEventHorizon.emit({
      eventType: 'navigator.activated',
      moduleId: this.manifest.id,
      timestamp: Date.now(),
      payload: {},
      semanticLabels: ['system', 'activation', 'navigator']
    });
  }

  async deactivate(): Promise<void> {
    if (this.state !== 'active') {
      console.warn('NavigatorModule is not active');
      return;
    }

    this.state = 'suspended';

    GlobalEventHorizon.emit({
      eventType: 'navigator.deactivated',
      moduleId: this.manifest.id,
      timestamp: Date.now(),
      payload: {},
      semanticLabels: ['system', 'deactivation', 'navigator']
    });
  }

  async destroy(): Promise<void> {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];

    this.state = 'destroyed';

    GlobalEventHorizon.emit({
      eventType: 'navigator.destroyed',
      moduleId: this.manifest.id,
      timestamp: Date.now(),
      payload: {},
      semanticLabels: ['system', 'destruction', 'navigator']
    });
  }

  getExposedItems(): Record<string, any> {
    return {
      assessmentAPI: {
        startAssessment: () => this.assessmentEngine.startAssessment(),
        submitResponse: (questionId: string, answer: any) =>
          this.assessmentEngine.submitResponse(questionId, answer),
        calculateProfile: () => this.assessmentEngine.calculateProfile(),
        getProgress: () => this.assessmentEngine.getProgress()
      },
      routingEngine: {
        getRouteForProfile: (profileId: string, chemicalState: ChemicalState) =>
          this.routingEngine.getRouteForProfile(profileId, chemicalState),
        assignTrack: (userId: string, trackId: string) =>
          this.routingEngine.assignTrack(userId, trackId)
      },
      safetyMonitor: {
        checkRisk: (profile: string, chemicalState: ChemicalState, regulationLevel: RegulationLevel) =>
          this.safetyMonitor.checkRisk(profile, chemicalState, regulationLevel),
        activateSafetyMode: () => this.safetyMonitor.activateSafetyMode()
      },
      state: {
        getCurrentProfile: () => this.currentProfile,
        getChemicalState: () => this.currentChemicalState,
        getRegulationLevel: () => this.currentRegulationLevel
      }
    };
  }

  private setupEventSubscriptions(): void {
    const moduleCompletedSub = GlobalEventHorizon.subscribe(
      'module.completed',
      async (event) => {
        await this.handleModuleCompletion(event.payload);
      }
    );
    this.subscriptions.push(moduleCompletedSub);

    const resonanceShiftSub = GlobalEventHorizon.subscribe(
      'valeion.resonanceShift',
      async (event) => {
        await this.handleResonanceShift(event.payload);
      }
    );
    this.subscriptions.push(resonanceShiftSub);

    const coherenceDropSub = GlobalEventHorizon.subscribe(
      'valeion.coherenceDrop',
      async (event) => {
        await this.handleCoherenceDrop(event.payload);
      }
    );
    this.subscriptions.push(coherenceDropSub);
  }

  private async handleModuleCompletion(payload: any): Promise<void> {
    GlobalEventHorizon.emit({
      eventType: 'navigator.reassessmentRequested',
      moduleId: this.manifest.id,
      timestamp: Date.now(),
      payload: {
        reason: 'module_completed',
        completedModule: payload.moduleId
      },
      semanticLabels: ['navigator', 'reassessment', 'module-completion']
    });
  }

  private async handleResonanceShift(payload: any): Promise<void> {
    if (payload.magnitude > 0.5) {
      GlobalEventHorizon.emit({
        eventType: 'navigator.reassessmentRequested',
        moduleId: this.manifest.id,
        timestamp: Date.now(),
        payload: {
          reason: 'resonance_shift',
          magnitude: payload.magnitude
        },
        semanticLabels: ['navigator', 'reassessment', 'resonance']
      });
    }
  }

  private async handleCoherenceDrop(_payload: any): Promise<void> {
    const riskAssessment = this.safetyMonitor.checkRisk(
      this.currentProfile?.name || 'Unknown',
      this.currentChemicalState,
      this.currentRegulationLevel
    );

    if (riskAssessment.riskLevel === 'high' || riskAssessment.riskLevel === 'critical') {
      GlobalEventHorizon.emit({
        eventType: 'navigator.safetyModeActivated',
        moduleId: this.manifest.id,
        timestamp: Date.now(),
        payload: {
          reason: 'coherence_drop',
          riskLevel: riskAssessment.riskLevel,
          intervention: 'grounding_protocol'
        },
        semanticLabels: ['navigator', 'safety', 'emergency', 'grounding']
      });

      this.safetyMonitor.activateSafetyMode();
    }
  }

  updateState(profile: NavigatorProfile, chemicalState: ChemicalState, regulationLevel: RegulationLevel): void {
    const previousProfile = this.currentProfile;

    this.currentProfile = profile;
    this.currentChemicalState = chemicalState;
    this.currentRegulationLevel = regulationLevel;

    GlobalEventHorizon.emit({
      eventType: 'navigator.stateProfileChanged',
      moduleId: this.manifest.id,
      timestamp: Date.now(),
      payload: {
        profile: profile.name,
        profileId: profile.id,
        chemicalState,
        regulationLevel,
        previousProfile: previousProfile?.name
      },
      semanticLabels: ['navigator', 'state-change', 'profile']
    });

    GlobalEventHorizon.emit({
      eventType: 'navigator.chemicalStateDetected',
      moduleId: this.manifest.id,
      timestamp: Date.now(),
      payload: {
        chemicalState,
        profile: profile.name
      },
      semanticLabels: ['navigator', 'chemical-state', 'substance']
    });
  }
}
