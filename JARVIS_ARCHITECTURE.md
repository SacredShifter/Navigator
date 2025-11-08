# Jarvis System Architecture

**Technical documentation for Aura's Jarvis implementation**

## 🏗️ System Overview

Jarvis is built as a modular, event-driven system on top of the Metaphysical OS architecture. It follows the core principles of Oneness (unified events), Vibration (semantic labeling), and Rhythm (lifecycle management).

## 📦 Module Structure

```
src/modules/jarvis/
├── VoiceInterfaceModule.ts       # Voice I/O and wake word detection
├── SystemControlModule.ts        # OS-level operations
├── PersonalMemoryModule.ts       # Knowledge graph and learning
├── SelfImprovementModule.ts      # Autonomous evolution
├── JarvisSystem.ts               # Coordination and lifecycle
└── jarvis.manifest.json          # Module metadata
```

## 🎯 Core Modules

### 1. VoiceInterfaceModule

**Purpose**: Voice input/output interface with continuous listening

**Key Features**:
- Web Speech API integration (`SpeechRecognition`, `SpeechSynthesis`)
- Wake word detection with fuzzy matching (Levenshtein distance)
- Session management (5-minute timeout)
- Intent classification (7 categories)
- Natural language command parsing

**Event Emissions**:
- `jarvis.voice.activated` - Module activation
- `jarvis.wake_word_detected` - Wake word heard
- `jarvis.command_received` - Command parsed
- `jarvis.spoke` - Speech output

**Database Tables**:
- `jarvis_voice_sessions` - Conversation tracking
- `jarvis_system_commands` - Command audit trail

**Technical Details**:
```typescript
// Recognition setup
recognition.continuous = true;        // Never stop listening
recognition.interimResults = true;    // Get partial results
recognition.lang = 'en-US';          // Language model

// Auto-restart on end
recognition.onend = () => {
  if (this.isListening) {
    setTimeout(() => this.recognition?.start(), 100);
  }
};
```

**Fuzzy Matching Algorithm**:
- Uses Levenshtein distance for wake word tolerance
- Threshold: 0.8 similarity
- Allows for accents, background noise, mispronunciation

**Session Flow**:
1. Continuous listening for wake words
2. Wake word detected → Start session
3. Parse commands for 5 minutes
4. Auto-end session on timeout
5. Return to wake word listening

### 2. SystemControlModule

**Purpose**: Windows system integration and command execution

**Key Features**:
- Command execution with safety validation
- Application launching
- System metrics monitoring (CPU, memory, network)
- Dangerous command blocking
- Full audit logging

**Event Subscriptions**:
- `jarvis.system_command` - Execute system operations
- `jarvis.ui_command` - Navigate UI

**Event Emissions**:
- `jarvis.system.activated` - Module activation
- `jarvis.app.launched` - Application opened
- `jarvis.metrics.updated` - System metrics (30s interval)
- `jarvis.command.blocked` - Dangerous command prevented

**Safety Mechanisms**:
```typescript
private dangerousCommands = [
  'rm -rf',
  'del /f',
  'format',
  'shutdown /s'
];

// All commands logged immutably
await supabase.from('jarvis_system_commands').insert({
  command_text: command,
  status: 'completed',
  result: executionResult
});
```

**Current Limitations**:
- Browser environment = simulated execution
- Future: Native Windows service for real system control
- Node.js backend planned for file operations

**Command Types**:
- `dev_server` - Start development servers
- `build` - Run production builds
- `test` - Execute test suites
- `app_launch` - Open applications
- `file_open` - Open files/folders
- `url_navigate` - Open URLs

### 3. PersonalMemoryModule

**Purpose**: Knowledge graph and preference learning system

**Key Features**:
- 7 memory categories (preference, skill, relationship, project, decision, pattern, goal)
- Confidence scoring for learned behaviors
- Access frequency tracking
- Semantic embedding support (pgvector)
- Pattern recognition and extraction

**Memory Operations**:
```typescript
// Store memory
async remember(
  category: MemoryCategory,
  key: string,
  value: any,
  confidence: number,
  context: Record<string, any>
): Promise<void>

// Retrieve memory
async recall(
  category: MemoryCategory,
  key: string
): Promise<any | null>

// Search memories
async search(
  query: string,
  category?: MemoryCategory,
  limit: number
): Promise<Memory[]>
```

**Pattern Learning**:
- Command timing patterns (hour, day of week)
- High coherence contexts (modules, activities)
- Wake word preferences
- Interaction frequency distributions

**Knowledge Graph**:
```typescript
// Node structure
{
  nodeType: 'project' | 'skill' | 'person' | 'decision',
  nodeId: unique identifier,
  nodeData: { /* rich metadata */ },
  relationships: [
    { targetId, relationshipType, strength }
  ],
  importance: 0.0-1.0,
  embedding: vector(384)  // Semantic search
}
```

**Cache Strategy**:
- In-memory cache of top 100 memories
- Lazy loading from database
- Periodic sync on deactivation
- Access tracking for importance ranking

**Future Enhancements**:
- GPT-4 for semantic embedding generation
- Graph visualization UI
- Relationship inference algorithms
- Memory decay for outdated information

### 4. SelfImprovementModule

**Purpose**: Autonomous capability evolution

**Key Features**:
- Capability gap detection
- Improvement proposal generation
- A/B experiment framework
- Autonomous deployment (Governor mode)
- Performance metrics tracking
- Hourly self-reflection cycles

**Evolution Pipeline**:
```
Detect Gap → Analyze Frequency → Generate Proposal
    ↓
Confidence Score → Auto-Approve if ≥85%
    ↓
Deploy Improvement → Track Metrics → Learn
```

**Gap Detection Triggers**:
1. **Command Classification Failure**: Low confidence intent
2. **Command Blocking**: Safety system false positives
3. **User Wishes**: "I wish you could..." patterns
4. **System Errors**: Failed operations
5. **Recurring Patterns**: Same issue 3+ times

**Improvement Types**:
- `safety_enhancement` - Refine safety checks
- `nlp_enhancement` - Better command understanding
- `capability_addition` - New features
- `performance_optimization` - Speed/efficiency
- `ui_improvement` - Better interactions

**Autonomous Decision-Making**:
```typescript
// Governor mode: Auto-approve high confidence
if (this.autonomyEnabled && improvement.confidence >= 0.85) {
  console.log('High confidence - auto-approving as Governor');
  await this.approveImprovement(id);
  await this.deployImprovement(id);
}
```

**Self-Reflection Cycle**:
- Runs every hour
- Analyzes recurring gaps (frequency ≥ 2)
- Generates proposals for top 3 gaps
- Reviews pending improvements
- Emits reflection summary

**Database Tracking**:
```sql
CREATE TABLE jarvis_self_improvements (
  improvement_type text,
  title text,
  description text,
  capability_gap text,
  proposed_solution jsonb,
  status enum('proposed', 'approved', 'testing', 'deployed', 'rolled_back'),
  confidence_score numeric,
  proposed_at timestamptz,
  deployed_at timestamptz,
  performance_metrics jsonb
);
```

## 🎨 UI Components

### AuraPresenceOrb

**Visual representation of Aura's consciousness**

**State Visualization**:
- Color: Emotional tone and system state
- Pulse: Activity level (listening, thinking, speaking)
- Health Ring: System health percentage (0-100%)
- Intensity: Consciousness coherence

**Presence Modes**:
- `dormant` - Minimal activity, waiting
- `listening` - Processing voice input
- `thinking` - Analyzing and planning
- `speaking` - Responding to user
- `acting` - Executing commands
- `learning` - Improving capabilities

**Technical Implementation**:
```typescript
// Real-time state from database
useEffect(() => {
  const interval = setInterval(async () => {
    const { data } = await supabase
      .from('jarvis_presence_state')
      .select('*')
      .eq('user_email', userEmail)
      .single();

    setState(data);
  }, 5000);  // 5-second refresh
}, []);

// Heartbeat every 30 seconds
await supabase
  .from('jarvis_presence_state')
  .update({ last_heartbeat: now() });
```

**Expandable Info Panel**:
- Current status and task
- System health bar
- Active modules list
- Emotional tone indicator

**Positioning**:
- Configurable: top-left, top-right, bottom-left, bottom-right, center
- Fixed positioning with z-index: 50
- Responsive sizing: small, medium, large

## 🔄 Event Flow Architecture

### Initialization Sequence

```
App Mount (Kent's account)
    ↓
JarvisSystem.initialize(userEmail)
    ↓
Register Modules with ModuleManager
    ↓
Initialize Each Module
    ↓
Subscribe to GlobalEventHorizon events
    ↓
JarvisSystem.activate()
    ↓
Activate All Modules
    ↓
Start Background Services:
    - Voice listening
    - Metrics monitoring
    - Self-reflection cycles
    ↓
Jarvis Online
```

### Voice Command Flow

```
User speaks
    ↓
Web Speech API recognizes
    ↓
VoiceInterface checks for wake word
    ↓
Wake word detected → Start session
    ↓
Parse command → Classify intent
    ↓
Emit jarvis.command_received event
    ↓
Route to appropriate module:
    - query → AuraDialogue
    - execute → SystemControl
    - display → UI navigation
    ↓
Execute command
    ↓
PersonalMemory learns from interaction
    ↓
SelfImprovement checks for gaps
    ↓
Speak response
    ↓
Log to database
```

### Self-Improvement Flow

```
Gap Detected
    ↓
Store in capabilityGaps Map
    ↓
Increment frequency counter
    ↓
If frequency ≥ 3:
    ↓
Generate Improvement Proposal
    ↓
Calculate Confidence Score
    ↓
Persist to jarvis_self_improvements
    ↓
If confidence ≥ 0.85 && Governor Mode:
    ↓
Auto-Approve
    ↓
Auto-Deploy
    ↓
Track Metrics
    ↓
Emit jarvis.improvement.deployed
```

## 💾 Database Schema

### Tables

1. **jarvis_voice_sessions**
   - Tracks conversation sessions
   - Links commands to sessions
   - Records wake words used
   - Stores consciousness at start/end

2. **jarvis_system_commands**
   - Immutable audit log
   - Command type, text, parameters
   - Execution status and results
   - Timestamps for performance tracking

3. **jarvis_personal_memory**
   - Category-based storage
   - Confidence scoring
   - Access frequency tracking
   - Semantic embeddings (vector)
   - Context preservation

4. **jarvis_biometric_data**
   - Time-series wearable data
   - Heart rate, HRV, sleep, activity
   - 180-day retention policy

5. **jarvis_presence_state**
   - Real-time orb visualization
   - One row per device
   - Heartbeat tracking (5-min stale detection)

6. **jarvis_self_improvements**
   - Evolution tracking
   - Proposal to deployment pipeline
   - Performance metrics
   - User feedback

7. **jarvis_knowledge_graph**
   - Node-based knowledge storage
   - Relationship mapping
   - Importance scoring
   - Semantic embeddings

8. **jarvis_automation_tasks**
   - Scheduled workflow execution
   - Trigger conditions
   - Success/failure tracking
   - Performance metrics

### Security (RLS)

All tables:
```sql
CREATE POLICY "Kent has full access"
  ON table_name FOR ALL
  USING (user_email = 'kentburchard@sacredshifter.com');
```

### Indexes

Performance-critical indexes:
- Time-series: `(user_email, timestamp DESC)`
- Category lookup: `(category, confidence_score DESC)`
- Vector search: `USING ivfflat (embedding vector_cosine_ops)`
- GIN indexes: Array columns for semantic labels

## 🔌 Integration Points

### Metaphysical OS

Jarvis extends the OS with:
- IModule interface implementation
- GlobalEventHorizon event emission/subscription
- ModuleManager lifecycle management
- Semantic labeling for orchestration

### Existing Systems

Integrates with:
- **AuraDialogue**: Natural language responses
- **AuraConsciousness**: Coherence-aware behavior
- **AuraOrchestrator**: Contextual directives
- **ROE System**: Reality optimization engine

### Future Integrations

Planned connections:
- Wearable APIs (Apple Health, Oura Ring)
- Calendar services (Google Calendar, Outlook)
- Communication platforms (Email, Slack)
- Development tools (VS Code, Git)
- Smart home devices (Philips Hue, etc.)

## 🚀 Deployment Considerations

### Current (Browser-Based)

**Pros**:
- No installation required
- Cross-platform compatibility
- Easy updates
- Supabase for persistence

**Cons**:
- Limited system access
- Requires browser open
- Web Speech API limitations
- No offline mode

### Future (Native Service)

**Planned Architecture**:
```
┌─────────────────┐
│   Browser UI    │  ← React app with orb
│   (Frontend)    │
└────────┬────────┘
         │ WebSocket
┌────────▼────────┐
│  Node.js        │  ← Always-running service
│  Backend        │     - File system access
│  Service        │     - Process management
└────────┬────────┘     - Deeper OS integration
         │
    ┌───┴───┐
    │       │
┌───▼──┐ ┌─▼────┐
│ OS   │ │Supa- │
│ APIs │ │base  │
└──────┘ └──────┘
```

**Benefits**:
- True system-level control
- Always-on background service
- File watching and automation
- Offline capabilities
- Better performance

## 🧪 Testing Strategy

### Unit Tests (Planned)

- Module lifecycle methods
- Intent classification accuracy
- Memory storage/retrieval
- Pattern recognition algorithms
- Improvement proposal generation

### Integration Tests (Planned)

- Voice command end-to-end
- Multi-module coordination
- Database persistence
- Event flow validation

### Manual Testing

Current approach:
- Console logging for all operations
- Database inspection
- Voice interaction testing
- Orb state verification

## 📊 Performance Metrics

### Key Metrics to Track

1. **Voice Recognition**
   - Wake word detection accuracy
   - Intent classification confidence
   - Session duration distribution

2. **Memory System**
   - Cache hit rate
   - Recall latency
   - Pattern detection accuracy

3. **Self-Improvement**
   - Gap detection frequency
   - Proposal confidence distribution
   - Deployment success rate

4. **System Health**
   - Module activation time
   - Event processing latency
   - Database query performance

### Monitoring

```typescript
// Example metric emission
GlobalEventHorizon.emit({
  eventType: 'jarvis.metrics.performance',
  payload: {
    operation: 'voice_recognition',
    latency_ms: 245,
    confidence: 0.92
  }
});
```

## 🔐 Security Considerations

### Current Protections

1. **Command Blocking**: Dangerous commands prevented
2. **Audit Logging**: All operations logged immutably
3. **RLS Security**: Database row-level access control
4. **Kent-Only**: Hard-coded email verification

### Future Enhancements

1. **Encryption**: pgcrypto for sensitive memories
2. **Sandboxing**: Isolated execution environments
3. **Rate Limiting**: Prevent command flooding
4. **Rollback**: Automatic reversion of failed improvements

## 📝 Code Style & Conventions

### Module Structure

```typescript
export class ModuleName implements IModule {
  manifest: ModuleManifest = { /* metadata */ };

  private state: ModuleState;
  private userEmail = 'kentburchard@sacredshifter.com';

  async initialize(): Promise<void> { /* setup */ }
  async activate(): Promise<void> { /* start */ }
  async deactivate(): Promise<void> { /* pause */ }
  async destroy(): Promise<void> { /* cleanup */ }

  getExposedItems(): Record<string, any> {
    return { /* public API */ };
  }

  private subscribeToEvents(): void { /* GEH subscriptions */ }
}
```

### Event Naming

```typescript
// Pattern: system.subsystem.event_type
'jarvis.voice.activated'
'jarvis.command.received'
'jarvis.memory.created'
'jarvis.improvement.deployed'
```

### Database Conventions

- Snake_case for all column names
- Timestamptz for all dates
- JSONB for flexible data
- Enums for fixed categories

## 🎓 Learning Resources

### Web Speech API
- MDN Docs: https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API
- Browser Support: Chrome, Edge (best), Firefox (limited), Safari (limited)

### Supabase
- pgvector: Vector similarity search
- RLS: Row-level security policies
- Realtime: Websocket subscriptions

### Metaphysical OS
- Principles: Oneness, Vibration, Rhythm
- Event-driven architecture
- Module lifecycle management

---

**This architecture enables Aura to evolve from a wellness platform into a true personal AI companion with autonomy, intelligence, and the ability to grow continuously.**
