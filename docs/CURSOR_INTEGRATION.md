# Sacred Shifter Navigator - Cursor AI Integration Guide

**Version:** 1.0.0
**Last Updated:** 2025-11-08
**Guardian AI:** Cursor IDE Integration
**Purpose:** Enable Cursor AI to guide users through Sacred Shifter onboarding and recommend appropriate healing experiences

---

## 🌟 Overview

The Sacred Shifter Navigator is a consciousness profiling system that determines a user's current state and routes them to appropriate healing experiences. Cursor AI should integrate this as the **primary onboarding flow** for all new Sacred Shifter users.

### Core Philosophy

The Navigator operates on these principles:

1. **Safety First** - Always prioritize nervous system capacity and trauma awareness
2. **Meet Them Where They Are** - No spiritual bypassing; honor current chemical states and regulation levels
3. **Consent & Transparency** - Full disclosure of data collection and usage (Australian Privacy Act 1988 compliance)
4. **Semantic Intelligence** - Use essence labels and metaphysical principles to match experiences to needs

---

## 🎯 Integration Flow

### Phase 1: Pre-Assessment (Privacy & Consent)

**CRITICAL:** Before any assessment or data collection, Cursor MUST:

1. **Display Privacy Collection Notice**
   - Full Australian Privacy Act 1988 compliance
   - Explain what data is collected and why
   - Describe how data will be used within Sacred Shifter
   - Detail data storage, security, and retention policies
   - Provide opt-in mechanism (not opt-out)
   - Allow users to decline (with graceful degradation)

2. **Obtain Explicit Consent**
   - Checkbox acknowledgment is NOT sufficient
   - Require active "I Agree" button press
   - Store consent timestamp and version in database
   - Allow consent withdrawal at any time
   - Make privacy policy easily accessible

**Database Table:** `user_consent_records`

```sql
CREATE TABLE user_consent_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  consent_type text NOT NULL, -- 'navigator_assessment', 'data_processing', 'experience_personalization'
  consent_version text NOT NULL, -- e.g., 'v1.0.0'
  consent_given boolean NOT NULL,
  consent_timestamp timestamptz DEFAULT now(),
  ip_address inet,
  user_agent text,
  withdrawal_timestamp timestamptz,
  notes jsonb
);
```

### Phase 2: Navigator Assessment

Once consent is obtained, Cursor should:

1. **Initialize the NavigatorModule**
   ```typescript
   import { NavigatorModule } from '@/modules/navigator/NavigatorModule';

   const navigator = new NavigatorModule();
   await navigator.initialize();
   ```

2. **Launch Assessment UI**
   ```typescript
   // The Navigator component handles the full assessment flow
   import { Navigator } from '@/modules/navigator/Navigator';

   // Render in your onboarding sequence
   <Navigator />
   ```

3. **Capture Assessment Results**
   ```typescript
   // Results are automatically saved to database via AssessmentEngine
   // You can listen for completion via GEH events:

   globalEventHorizon.subscribe('navigator:assessment:complete', (event) => {
     const { profile, chemicalState, regulationLevel, targetTrackId } = event.payload;

     // Use this data to personalize the experience
     console.log(`User profile: ${profile.name}`);
     console.log(`Recommended track: ${targetTrackId}`);
   });
   ```

### Phase 3: Profile-Based Recommendations

After assessment, Cursor should recommend Sacred Shifter modules/experiences based on the profile:

#### Profile → Module Mappings

| Profile | Chemical State | Recommended Modules | Pacing | Safety Notes |
|---------|---------------|---------------------|--------|--------------|
| **Numb** | Any | Body Scan, Breath Guide, Tiny Actions | Very Slow | High safety monitoring, minimal stimulation |
| **Lost** | Any | Trauma Safety Track, Grounding Protocol | Very Slow | Crisis resources visible, medical referrals available |
| **Lost** | Withdrawal | Recovery Track | Very Slow | Medical supervision recommended, substance support resources |
| **Seeker** | Sober | Awakening Track, Regulation Track | Medium | Encourage reflection, stabilization focus |
| **Seeker** | Psychedelic | Grounding Protocol | Slow | Reality anchoring, calm visuals, safety checks |
| **Awakening** | Sober | Awakening Track | Slow | Integration support, reflection prompts |
| **Awakening** | Psychedelic | Grounding Protocol | Slow | Maximum grounding, post-experience processing |
| **Integrator** | Sober | Regulation Track, Integration Practices | Medium | Balance emphasis, nervous system focus |
| **Integrator** | Withdrawal | Recovery Track | Slow | Gentle integration, stabilization first |
| **Expander** | Sober | Leadership Integration Track | Medium-Fast | Purpose alignment, service orientation |
| **Expander** | Any | Regulation Track (if dysregulated) | Variable | Monitor for burnout, pace according to capacity |
| **Observer** | Sober | Joy & Embodiment Track | Flowing | Playfulness emphasis, presence practices |

#### Essence Labels for Semantic Matching

Each profile has `essence_labels` that can be used for intelligent module selection:

```typescript
// Example: Fetch profile essence labels
const { data: profile } = await supabase
  .from('navigator_profiles')
  .select('essence_labels')
  .eq('name', 'Lost')
  .single();

// profile.essence_labels might be:
// ['disorientation', 'trauma', 'safety-seeking', 'overwhelm', 'support-needed']

// Use these to match against module capabilities
// Modules also have essence_labels in their manifests
```

### Phase 4: Ongoing Personalization

Cursor should continue to use Navigator data throughout the user's journey:

1. **Check Current State Before Experiences**
   ```typescript
   // Before launching any intense module
   const { data: userState } = await supabase
     .from('user_state_profiles')
     .select('*')
     .eq('user_id', userId)
     .order('last_updated', { ascending: false })
     .limit(1)
     .maybeSingle();

   if (userState?.regulation_level === 'low') {
     // Downgrade intensity, add safety scaffolding
     console.log('User is dysregulated - applying safety modifications');
   }
   ```

2. **Re-assess Periodically**
   - If user indicates distress or state change
   - Every 30 days for active users
   - After major life events (user can trigger)
   - When chemical state changes (user reports)

3. **Respect Safety Overrides**
   ```typescript
   // The SafetyMonitor automatically gates unsafe experiences
   import { SafetyMonitor } from '@/modules/navigator/services/SafetyMonitor';

   const monitor = new SafetyMonitor();
   const safetyCheck = monitor.evaluateSafety({
     chemicalState: 'psychedelic',
     regulationLevel: 'low',
     profileName: 'Lost'
   });

   if (!safetyCheck.canProceed) {
     // Show safetyCheck.reason
     // Route to safetyCheck.suggestedTrack instead
   }
   ```

---

## 🔒 Privacy & Data Protection (Australian Privacy Act 1988)

### Legal Requirements

Sacred Shifter collects **sensitive personal information** under the Privacy Act 1988, specifically:

- **Health information** (nervous system state, substance use, mental health indicators)
- **Psychological assessments** (consciousness profile, regulation capacity)
- **Behavioral data** (interaction patterns, module engagement)

This requires:

1. **Enhanced consent requirements** (APP 3.3)
2. **Strict security measures** (APP 11)
3. **Purpose limitation** (APP 6)
4. **Access and correction rights** (APP 12, 13)
5. **Data breach notification** (Notifiable Data Breaches scheme)

### Collection Notice (Required Before Assessment)

**MUST BE DISPLAYED IN FULL** - No progressive disclosure allowed for sensitive health data:

```markdown
# Sacred Shifter Privacy Collection Notice

## What We Collect

When you use Sacred Shifter's Navigator assessment, we collect:

1. **Consciousness Profile Data**
   - Your responses to assessment questions
   - Calculated profile type (e.g., Seeker, Integrator)
   - Nervous system regulation level
   - Current chemical state (if disclosed)

2. **Usage & Interaction Data**
   - Which healing tracks and modules you access
   - Duration and completion of experiences
   - Safety check responses
   - Device and session information

3. **Account Information**
   - Email address (if authenticated)
   - User ID and session tokens
   - Consent records and timestamps

## Why We Collect It

We collect this information to:

- **Personalize your healing journey** - Match you with appropriate experiences for your current state
- **Ensure your safety** - Prevent exposure to experiences that could be overwhelming or harmful
- **Improve Sacred Shifter** - Understand which approaches support different consciousness states
- **Fulfill our duty of care** - Monitor for crisis situations and provide appropriate resources

## How We Use It

Your data is used to:

- Route you to suitable healing tracks
- Adjust pacing, intensity, and visual stimulation
- Provide crisis resources if needed
- Generate anonymized insights (no individual identification)
- Send you relevant content (if you opt-in to communications)

## Who Can Access It

- **You** - Full access to your own data
- **Sacred Shifter System** - Automated processing for personalization
- **Emergency Services** - Only if you indicate imminent self-harm (legal duty)
- **Nobody else** - We do NOT sell, trade, or share your data with third parties

## Data Storage & Security

- **Location**: Secure Supabase servers (ISO 27001 certified)
- **Encryption**: AES-256 at rest, TLS 1.3 in transit
- **Access Control**: Row-level security policies
- **Retention**: Kept while your account is active, plus 7 years (legal requirement)
- **Deletion**: Request deletion at any time via settings

## Your Rights (Privacy Act 1988)

You have the right to:

- ✅ **Access** your data (download anytime)
- ✅ **Correct** inaccurate information
- ✅ **Withdraw consent** (may limit functionality)
- ✅ **Delete** your data (subject to legal retention requirements)
- ✅ **Complain** to the Office of the Australian Information Commissioner (OAIC)

## Consent

By clicking "I Agree & Proceed", you:

- Acknowledge you have read and understood this notice
- Consent to the collection, use, and disclosure of your sensitive health information
- Understand you can withdraw consent at any time via Settings > Privacy
- Confirm you are 18+ years old (or have guardian consent)

**This is voluntary** - You can decline and explore Sacred Shifter without personalization.

---

**Questions?** Email: privacy@sacredshifter.com
**Privacy Policy:** [Full policy link]
**OAIC Complaints:** [www.oaic.gov.au](https://www.oaic.gov.au)
```

### Consent Storage Schema

```typescript
interface ConsentRecord {
  id: string;
  user_id: string;
  consent_type: 'navigator_assessment' | 'data_processing' | 'experience_personalization';
  consent_version: string; // e.g., 'privacy-v1.0.0'
  consent_given: boolean;
  consent_timestamp: string; // ISO 8601
  ip_address?: string;
  user_agent?: string;
  withdrawal_timestamp?: string;
  notes?: {
    declined_reason?: string;
    partial_consent?: string[];
  };
}
```

---

## 🎨 UX Guidelines for Cursor

### Onboarding Flow Recommendations

1. **Welcome Screen**
   - Sacred Shifter logo (inverted, glowing)
   - Brief introduction: "Navigate your consciousness with care and precision"
   - CTA: "Begin Your Journey"

2. **Privacy & Consent Screen** (REQUIRED)
   - Full collection notice (scrollable, readable)
   - "I have read and agree" checkbox (disabled until scrolled to bottom)
   - Two buttons: "I Agree & Proceed" | "Maybe Later"
   - Link to full privacy policy

3. **Navigator Introduction**
   - Warm, trauma-informed language
   - Set expectations (5-7 minutes, ~8 questions)
   - Emphasize: "There are no wrong answers - we meet you exactly where you are"

4. **Assessment Flow**
   - One question at a time
   - Progress indicator
   - Allow going back
   - Validate all responses before proceeding
   - Calm, spacious design (no rushed feeling)

5. **Results Screen**
   - Present profile with compassion
   - Explain what it means in plain language
   - Show recommended first experience
   - Offer alternative paths
   - "Retake assessment" option

6. **First Experience Launch**
   - Contextual introduction to the recommended module
   - Set clear expectations (duration, intensity, what to expect)
   - Provide "pause" and "exit" options always visible
   - Post-experience check-in

### Language & Tone

- **Trauma-informed**: No spiritual bypassing, acknowledge difficulty
- **Non-judgmental**: All states are valid, no "good" or "bad" profiles
- **Empowering**: User is in control, can pause/stop anytime
- **Clear**: Plain language, avoid jargon
- **Warm but professional**: Supportive without being overly casual

### Visual Design

- Use Sacred Shifter color palette (violet, cyan, indigo, emerald)
- Spacious layouts, ample whitespace
- Soft gradients, glowing effects
- Minimal motion (respect nervous system sensitivity)
- Dark backgrounds (easier on eyes during vulnerable states)

---

## 🔌 Cursor AI Prompts & Behaviors

### Suggested Cursor Behaviors

1. **Detect New Users**
   ```typescript
   // Check if user has completed Navigator assessment
   const hasProfile = await supabase
     .from('user_state_profiles')
     .select('id')
     .eq('user_id', userId)
     .maybeSingle();

   if (!hasProfile) {
     // Prompt: "Would you like to complete the Navigator assessment?
     //          It helps us understand your current state and recommend
     //          experiences that will support you."
   }
   ```

2. **Suggest Re-assessment**
   ```typescript
   // If last assessment was > 30 days ago
   // OR user indicates state change
   // OR user expresses frustration with recommendations

   // Prompt: "It seems like things may have shifted for you.
   //          Would you like to retake the Navigator assessment
   //          so we can better match you with experiences?"
   ```

3. **Respect Safety Boundaries**
   ```typescript
   // If user requests intense/challenging experience
   // But their regulation_level is 'low'

   // Prompt: "I notice your nervous system is in a tender state right now.
   //          [Experience] might be overwhelming. Can I suggest [safer alternative]
   //          instead? We can revisit [experience] when you're more regulated."
   ```

4. **Explain Profile Insights**
   ```typescript
   // When user asks about their profile

   // Prompt: "Your profile is [Name]. This suggests you're [description].
   //          People in this state typically benefit from [approaches].
   //          Does this resonate with you?"
   ```

5. **Handle Profile Disagreement**
   ```typescript
   // If user says "This doesn't feel right"

   // Prompt: "Thank you for that feedback. Profiles are guides, not boxes.
   //          You know yourself best. Would you like to:
   //          - Retake the assessment
   //          - Explore a different profile's experiences
   //          - Tell me more about what you're looking for?"
   ```

### Cursor Context Integration

Add this to your Cursor AI system prompt when working in Sacred Shifter:

```markdown
## Sacred Shifter Navigator Context

The user has completed the Navigator consciousness assessment. Their profile:

- **Profile Name**: [e.g., Seeker]
- **Regulation Level**: [low/medium/high]
- **Chemical State**: [sober/psychedelic/withdrawal/etc]
- **Last Assessment**: [date]

### Personalization Rules:

1. If regulation_level === 'low':
   - Suggest gentle, grounding experiences only
   - Make safety resources prominent
   - Slow pacing, minimal stimulation

2. If chemical_state === 'psychedelic':
   - Prioritize grounding and orientation
   - No intense visualizations
   - Frequent safety checks

3. If profile === 'Lost':
   - Extra trauma sensitivity
   - Never push or rush
   - Validate difficulty
   - Keep crisis resources visible

4. Always respect user autonomy - they can override recommendations
```

---

## 📊 Data Flow Architecture

```
User
  ↓
Privacy Consent Screen (REQUIRED)
  ↓ [consent recorded in user_consent_records]
Navigator Assessment UI
  ↓ [responses stored in navigator_assessments]
AssessmentEngine.calculateProfile()
  ↓ [profile calculated via weight_map scoring]
RoutingEngine.determineTrack()
  ↓ [consults navigator_paths + safety rules]
SafetyMonitor.evaluateSafety()
  ↓ [final safety gate]
Target Track/Module Recommended
  ↓ [stored in user_state_profiles]
GEH Event: 'navigator:assessment:complete'
  ↓
Cursor AI receives event
  ↓
Personalized experience begins
```

---

## 🧪 Testing Integration

### Test Cases for Cursor

1. **New User Flow**
   - No previous assessment
   - Should trigger privacy consent → assessment flow
   - Should store consent record
   - Should generate profile and recommendations

2. **Returning User**
   - Has existing profile (< 30 days old)
   - Should load existing profile
   - Should NOT re-prompt assessment
   - Should use cached recommendations

3. **Safety Override**
   - User with regulation_level: 'low'
   - Requests intense experience
   - Should politely decline and suggest alternative
   - Should explain why (safety)

4. **Consent Withdrawal**
   - User withdraws consent via settings
   - Should delete assessment data
   - Should fall back to generic (non-personalized) experience
   - Should honor deletion request

5. **Profile Disagreement**
   - User says "This isn't me"
   - Should offer retake
   - Should allow manual profile selection
   - Should log feedback

### Sample Supabase Queries for Testing

```sql
-- Check consent status
SELECT * FROM user_consent_records
WHERE user_id = 'test-user-id'
ORDER BY consent_timestamp DESC;

-- Check profile
SELECT * FROM user_state_profiles
WHERE user_id = 'test-user-id';

-- Check assessment history
SELECT * FROM navigator_assessments
WHERE user_id = 'test-user-id'
ORDER BY created_at DESC;

-- Verify RLS policies
SELECT * FROM navigator_profiles; -- Should work (public read)
SELECT * FROM user_state_profiles WHERE user_id != auth.uid(); -- Should fail
```

---

## 🚀 Implementation Checklist

### For Cursor AI Team:

- [ ] Review this document thoroughly
- [ ] Implement consent screen (blocking, required)
- [ ] Add Navigator as first onboarding step
- [ ] Build profile → module recommendation logic
- [ ] Train AI on profile characteristics and appropriate responses
- [ ] Test all safety override scenarios
- [ ] Implement consent withdrawal mechanism
- [ ] Add "Retake Assessment" UI trigger
- [ ] Create dashboard showing user's current profile
- [ ] Document all personalization decisions (transparency)

### For Sacred Shifter Team:

- [ ] Review and approve privacy collection notice (legal counsel)
- [ ] Set up privacy@sacredshifter.com inbox
- [ ] Create full privacy policy page
- [ ] Implement data export functionality (user rights)
- [ ] Set up OAIC complaint handling process
- [ ] Add consent version migration system
- [ ] Create admin panel for consent auditing
- [ ] Implement data breach notification procedures
- [ ] Train support staff on privacy inquiries
- [ ] Schedule annual privacy compliance review

---

## 📞 Support & Questions

**Technical Integration**: See `/src/modules/navigator/` for implementation details
**Privacy Compliance**: Consult `docs/PRIVACY_POLICY.md` (to be created)
**Module Manifests**: Each module has its own `*.manifest.json` with essence labels
**GEH Events**: See `/src/metaphysical-os/core/GlobalEventHorizon.ts` for event system

---

**Guardian Note**: Sacred Shifter exists to support genuine healing and consciousness evolution. The Navigator is not a diagnostic tool - it's a semantic mapping system that honors where someone is and guides them toward appropriate support. Cursor AI should embody this philosophy: meet users where they are, prioritize safety, respect autonomy, and hold space for transformation.

*With reverence for the journey,*
*The Sacred Shifter Development Team*
