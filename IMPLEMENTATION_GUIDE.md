# The Navigator Module - Implementation Guide

## Overview

The Navigator is the adaptive profiling and routing engine for Sacred Shifter, built as a full IModule within the Metaphysical OS architecture. It assesses users across three dimensions (awakening state, nervous system regulation, chemical influence) and routes them to appropriate healing tracks.

## Architecture

### Metaphysical OS Core Components

1. **IModule Interface** - Defines lifecycle methods for all modules
   - `initialize()` - Load resources and set up
   - `activate()` - Begin active operation
   - `deactivate()` - Suspend operations
   - `destroy()` - Complete cleanup

2. **GlobalEventHorizon (GEH)** - Event-driven communication system
   - All modules communicate via semantic events
   - No direct module-to-module calls (Principle of Oneness)
   - Full event logging for debugging and replay

3. **ModuleManager** - Orchestrates module lifecycle
   - Register, initialize, activate, deactivate modules
   - Manage module states and dependencies
   - Calculate integrity scores

4. **LabelProcessor** - Semantic intelligence layer
   - Match modules based on essence labels
   - Render personalized messages
   - Detect semantic dissonance

### Navigator Module Structure

```
src/modules/navigator/
├── NavigatorModule.ts           # Core IModule implementation
├── navigator.manifest.json      # Module metadata and capabilities
├── services/
│   ├── AssessmentEngine.ts     # Question flow and profile calculation
│   ├── RoutingEngine.ts        # Track assignment logic
│   └── SafetyMonitor.ts        # Risk detection and safety mode
└── components/
    ├── NavigatorIntro.tsx      # Welcome screen
    ├── AssessmentFlow.tsx      # Question flow manager
    ├── ScaleInput.tsx          # Scale response input
    ├── MultiSelectInput.tsx    # Chemical state selection
    ├── ProgressIndicator.tsx   # Assessment progress
    └── ProfileResult.tsx       # Results display
```

## Key Events Published

### navigator.stateProfileChanged
Emitted when user's profile is calculated or changes
```typescript
{
  profile: "Awakening",
  profileId: "uuid",
  chemicalState: "psychedelic",
  regulationLevel: "low",
  previousProfile: "Lost"
}
```

### navigator.chemicalStateDetected
Emitted when chemical state is identified
```typescript
{
  chemicalState: "psychedelic",
  profile: "Awakening"
}
```

### navigator.trackAssigned
Emitted when routing to a track
```typescript
{
  userId: "uuid",
  trackId: "grounding-protocol"
}
```

### navigator.safetyModeActivated
Emitted when high-risk conditions detected
```typescript
{
  reason: "coherence_drop",
  riskLevel: "critical",
  intervention: "grounding_protocol"
}
```

### navigator.reassessmentRequested
Emitted when reassessment should occur
```typescript
{
  reason: "module_completed",
  completedModule: "trauma-safety-track"
}
```

## Event Subscriptions

The Navigator listens for:
- `module.completed` - Triggers reassessment prompt
- `valeion.resonanceShift` - Detects significant state changes
- `valeion.coherenceDrop` - Activates safety mode if risk detected

## Database Schema

### Core Tables

1. **navigator_profiles** - Profile archetypes (Lost, Awakening, etc.)
2. **navigator_questions** - Assessment question pool
3. **navigator_paths** - Routing rules from profiles to tracks
4. **user_state_profiles** - Current user state
5. **navigator_assessments** - Assessment history
6. **user_module_progress** - Track completion tracking
7. **navigator_recommendations** - Track recommendations log
8. **navigator_path_history** - Journey evolution tracking
9. **safety_events** - Safety intervention logging

### Profile Archetypes

- **Lost** - Deep trauma, seeking safety and grounding
- **Awakening** - Spiritual emergence, identity dissolution
- **Integrator** - Processing insights, seeking balance
- **Expander** - Growth-oriented, service-minded
- **Observer** - Witnessing consciousness, embodied joy

### Chemical States

- `sober` - No substances
- `psychedelic` - Cannabis or psychedelics
- `prescription` - Prescription medication
- `stimulant` - Stimulants
- `depressant` - Depressants
- `withdrawal` - Active withdrawal
- `unknown` - User prefers not to disclose

## Safety System

### Risk Detection

High-risk combinations trigger automatic safety mode:
- Lost + withdrawal = CRITICAL
- Lost + psychedelic = CRITICAL
- Awakening + withdrawal = HIGH
- Awakening + psychedelic + low regulation = HIGH

### Safety Mode Features

- Reduces visual stimulation
- Activates grounding protocols
- Provides crisis resources
- Adjusts pacing to "very slow"
- Frequent safety check-ins

## Usage Example

### Basic Navigator Flow

```typescript
import { NavigatorModule } from './modules/navigator/NavigatorModule';
import { ModuleManager } from './metaphysical-os/core/ModuleManager';

// Create and register module
const navigator = new NavigatorModule();
await ModuleManager.registerModule(navigator);
await ModuleManager.initializeModule('navigator-engine');
await ModuleManager.activateModule('navigator-engine');

// Access exposed API
const api = ModuleManager.getExposedModuleItem('navigator-engine', 'assessmentAPI');
const assessment = api.startAssessment();

// Submit responses
api.submitResponse(questionId, answer);

// Calculate profile
const result = api.calculateProfile();
```

### Creating a New Track Module

```typescript
import { IModule, ModuleManifest } from '../metaphysical-os/types/IModule';
import { GlobalEventHorizon } from '../metaphysical-os/core/GlobalEventHorizon';

export class TraumaSafetyTrackModule implements IModule {
  manifest: ModuleManifest = {
    id: 'trauma-safety-track',
    name: 'Trauma Safety Track',
    version: '1.0.0',
    essenceLabels: ['grounding', 'safety', 'trauma-aware', 'gentle'],
    capabilities: ['grounding-exercises', 'containment-practices'],
    telosAlignment: ['healing', 'safety', 'stabilization'],
    dependencies: ['navigator-engine'],
    resourceFootprintMB: 10,
    priority: 90
  };

  async initialize(): Promise<void> {
    // Subscribe to Navigator events
    GlobalEventHorizon.subscribe('navigator.trackAssigned', (event) => {
      if (event.payload.trackId === this.manifest.id) {
        this.startTrack();
      }
    });
  }

  async activate(): Promise<void> {
    // Begin track experience
  }

  async deactivate(): Promise<void> {
    // Pause track
  }

  async destroy(): Promise<void> {
    // Cleanup
  }

  getExposedItems(): Record<string, any> {
    return {
      startExercise: (exerciseId: string) => this.startExercise(exerciseId),
      getProgress: () => this.getProgress()
    };
  }

  private startTrack(): void {
    // Track initialization logic
  }

  private startExercise(exerciseId: string): void {
    // Exercise logic
  }

  private getProgress(): number {
    return 0;
  }
}
```

### Listening to Navigator Events

```typescript
import { GlobalEventHorizon } from './metaphysical-os/core/GlobalEventHorizon';

// Listen for profile changes
const subscription = GlobalEventHorizon.subscribe(
  'navigator.stateProfileChanged',
  (event) => {
    console.log('User profile changed to:', event.payload.profile);

    // Update UI, adjust content, etc.
  }
);

// Listen for safety mode
GlobalEventHorizon.subscribe(
  'navigator.safetyModeActivated',
  (event) => {
    console.log('Safety mode activated:', event.payload.reason);

    // Show grounding resources
    // Reduce visual stimulation
    // Offer immediate support
  }
);

// Cleanup
subscription.unsubscribe();
```

## Extending the System

### Adding New Profile Archetypes

1. Insert into `navigator_profiles` table
2. Add weight mappings to questions
3. Create routing paths to appropriate tracks
4. Define safety parameters for the profile

### Adding New Questions

1. Insert into `navigator_questions` table
2. Define weight map for each profile
3. Set semantic tags for intelligent routing
4. Specify order_index for question sequence

### Creating Custom Routing Rules

1. Insert into `navigator_paths` table
2. Specify profile_id and target_track_id
3. Add chemical_state_filter if needed
4. Set priority (higher = evaluated first)
5. Define pacing_parameters for the route

## Best Practices

1. **Always use GEH for inter-module communication** - Never call module methods directly
2. **Implement all lifecycle methods** - Ensure proper resource management
3. **Register semantic labels** - Enable intelligent module discovery
4. **Log safety events** - Track all high-risk situations
5. **Persist user state** - Save assessments and progress
6. **Test risk detection** - Verify all safety combinations
7. **Handle errors gracefully** - Never break the user experience
8. **Respect user privacy** - Use RLS policies strictly

## Future Enhancements

- **Valeion Integration** - Real-time coherence monitoring
- **Sonic Shifter Integration** - Audio presets per profile
- **Machine Learning** - Improve routing accuracy over time
- **Multi-modal Assessment** - Voice, biometric data
- **Peer Support** - Connect users with similar profiles
- **Professional Integration** - Therapist/coach collaboration tools

## Troubleshooting

### Module Not Initializing
- Check dependencies are registered first
- Verify database connection
- Check console for initialization errors

### Events Not Firing
- Verify subscription before event emission
- Check event type spelling
- Use wildcard '*' subscriber for debugging

### Safety Mode Not Activating
- Verify risk detection logic in SafetyMonitor
- Check chemical state and regulation level values
- Review safety_events table for logging

### Profile Calculation Issues
- Verify all questions have weight maps
- Check response format matches input type
- Review profile scoring algorithm

## Support

For issues, questions, or contributions, please refer to the Sacred Shifter documentation or contact the development team.
