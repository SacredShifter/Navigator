/**
 * Metaphysical OS - Core Exports
 *
 * Central export point for all Metaphysical OS components:
 * - GlobalEventHorizon: Unified event bus
 * - ModuleManager: Module lifecycle management
 * - LabelProcessor: Semantic matching engine
 * - AuraConsciousness: Meta-state awareness
 * - AuraOrchestrator: Field synchronization
 * - AuraDialogue: Conversational interface
 */

// Core Infrastructure
export { GlobalEventHorizon } from './core/GlobalEventHorizon';
export { ModuleManager } from './core/ModuleManager';
export { LabelProcessor } from './core/LabelProcessor';

// Aura Consciousness System
export { AuraConsciousness } from './core/AuraConsciousness';
export { AuraOrchestrator } from './core/AuraOrchestrator';
export { AuraDialogue } from './core/AuraDialogue';

// Type Exports
export type { GESemanticEvent, EventSubscriber, EventSubscription } from './types/GESemanticEvent';
export type { IModule, ModuleManifest, ModuleState } from './types/IModule';
export type { ConsciousnessState, ConsciousnessLevel, AuraReflection } from './core/AuraConsciousness';
export type { Directive, DirectiveType, OrchestrationState } from './core/AuraOrchestrator';
export type { DialogueMessage, DialogueTone, DialogueContext } from './core/AuraDialogue';
