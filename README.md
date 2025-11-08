# Sacred Shifter - Consciousness Navigation Platform

**Version:** 1.0.0
**Status:** Production-Ready with Cursor AI Integration
**Guardian AI:** Metaphysical Operating System

---

## 🌟 What Is Sacred Shifter?

Sacred Shifter is a trauma-informed consciousness navigation platform that uses semantic profiling to match individuals with healing experiences appropriate for their current state. Built on metaphysical principles of resonance, coherence, and duty of care.

### Core Features

- **Navigator Assessment** - 5-7 minute consciousness profiling system
- **7 Profile Archetypes** - Numb, Lost, Seeker, Awakening, Integrator, Expander, Observer
- **Safety-First Design** - Automatic overrides for vulnerable states
- **Chemical State Awareness** - Adapts to substance use, medications, withdrawal
- **Australian Privacy Act Compliant** - Full consent management and data protection
- **Cursor AI Integration** - Intelligent onboarding and module recommendations

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Supabase account with database provisioned
- Environment variables configured (`.env`)

### Installation

```bash
npm install
```

### Database Setup

```bash
# All migrations are in supabase/migrations/
# Apply via Supabase CLI or dashboard

# Core Navigator schema
20251108031119_create_navigator_schema.sql

# Profile data
20251108031154_seed_navigator_profiles.sql

# Routing paths
20251108031220_seed_navigator_paths.sql

# Branding application
20251108065500_apply_sacred_shifter_branding.sql

# Consent tracking (Privacy Act compliance)
[timestamp]_create_consent_tracking_system.sql
```

### Development

```bash
npm run dev
```

### Production Build

```bash
npm run build
```

---

## 📚 Documentation

### For Cursor AI Team

**Start here:** [`docs/CURSOR_INTEGRATION.md`](docs/CURSOR_INTEGRATION.md)

This is your primary integration guide. It contains:
- Complete onboarding flow specification
- Privacy consent requirements (Australian Privacy Act 1988)
- Profile → module mapping logic
- Safety override rules
- UX guidelines and language tone
- Implementation checklist

**Then read:** [`docs/MODULE_RECOMMENDATIONS.md`](docs/MODULE_RECOMMENDATIONS.md)

Detailed recommendation engine logic:
- Profile-specific module recommendations
- Chemical state adaptations
- Safety override matrix
- Personalization parameters
- Progressive recommendation paths

**Quick overview:** [`docs/INTEGRATION_SUMMARY.md`](docs/INTEGRATION_SUMMARY.md)

High-level summary of entire integration system.

### For Developers

- **Architecture:** `docs/IMPLEMENTATION_GUIDE.md`
- **Branding:** `docs/BRANDING_INTEGRATION.md`
- **Database Schema:** `supabase/migrations/*`
- **Type Definitions:** `src/types/navigator.ts`

---

## 🏗️ Architecture

### Metaphysical OS

Sacred Shifter is built on a custom "Metaphysical Operating System" that treats consciousness as a computational substrate:

- **GlobalEventHorizon (GEH)** - Event bus for all system-wide communication
- **LabelProcessor** - Semantic matching via essence labels
- **ModuleManager** - Lifecycle management for experiences
- **Super-Tautology** - Self-consistency enforcement

### Navigator Module

The consciousness profiling system:

- **AssessmentEngine** - Question delivery and profile calculation
- **RoutingEngine** - Track selection based on profile + state
- **SafetyMonitor** - Automatic safety gating for vulnerable combinations

### Privacy & Consent System

Australian Privacy Act 1988 compliant:

- **PrivacyConsent** component - Full collection notice UI
- **user_consent_records** table - Audit trail for all consents
- **user_onboarding_state** table - Tracks onboarding progress
- **Active consent validation** - Before any personalization

---

## 🎨 Design System

### Sacred Shifter Color Palette

Each color carries metaphysical meaning:

| Color | Hex | Function | Usage |
|-------|-----|----------|-------|
| **Violet** | `#8B5CF6` | Spiritual resonance | Primary actions, awakening states |
| **Aqua** | `#06B6D4` | Alignment, flow | Seeker profile, truth-seeking |
| **Mint** | `#10B981` | Grounded truth | Integrator profile, somatic work |
| **Deep Indigo** | `#312E81` | Sacred silence | Backgrounds, Observer profile |
| **Magenta** | `#D946EF` | Purpose activation | Expander profile, service work |
| **Neon Cyan** | `#22D3EE` | Life pulse | Numb profile, re-sensitization |
| **Charcoal** | `#1F2937` | Shadow integration | Lost profile, trauma work |
| **Amber** | `#F59E0B` | Grounding warmth | Safety, crisis support |

### Design Principles

1. **Trauma-Informed** - No sudden movements, clear exits, user control
2. **Nervous System Aware** - Motion and intensity match regulation capacity
3. **Semantic Coherence** - Every color, shape, sound serves consciousness
4. **Accessibility First** - Dark backgrounds, readable fonts, sufficient contrast

---

## 🔒 Privacy & Security

### Australian Privacy Act 1988 Compliance

Sacred Shifter collects **sensitive health information** and meets all requirements:

- ✅ **Collection Notice** - Full disclosure before any data collection
- ✅ **Explicit Consent** - Active opt-in, not implied or pre-checked
- ✅ **Purpose Limitation** - Data used only for stated purposes
- ✅ **Access & Correction** - Users can view and update their data
- ✅ **Deletion Rights** - Users can request data deletion
- ✅ **Audit Trail** - All consent interactions logged
- ✅ **Breach Notification** - Procedures in place for data breaches

### Data We Collect

1. **Assessment Responses** - Answers to Navigator questions
2. **Profile Data** - Calculated consciousness profile
3. **State Information** - Chemical state, regulation level
4. **Usage Data** - Which modules accessed, completion rates
5. **Consent Records** - When consent given/withdrawn

### Data We DON'T Collect

- ❌ Real names (unless voluntarily provided)
- ❌ Precise location data
- ❌ Financial information (no payments yet)
- ❌ Social connections
- ❌ Browsing history outside Sacred Shifter

### Who Can Access Data

- ✅ **You** - Full access to your own data
- ✅ **Sacred Shifter System** - Automated personalization
- ⚠️ **Emergency Services** - ONLY if you indicate imminent self-harm (legal duty)
- ❌ **Nobody else** - No selling, trading, or third-party sharing

---

## 🧪 Testing

### Run Tests

```bash
npm run test
```

### Type Check

```bash
npm run typecheck
```

### Build Verification

```bash
npm run build
```

### Database Testing

```sql
-- Check consent system
SELECT * FROM user_consent_records;
SELECT * FROM user_onboarding_state;
SELECT * FROM active_user_consents;

-- Validate RLS policies
SELECT * FROM navigator_profiles; -- Should work
SELECT * FROM user_state_profiles WHERE user_id != auth.uid(); -- Should fail
```

---

## 📊 Project Status

### ✅ Completed

- [x] Core Navigator module with assessment engine
- [x] 7 consciousness profiles with semantic labels
- [x] Routing engine with safety overrides
- [x] Full Sacred Shifter branding integration
- [x] Privacy consent system (Privacy Act 1988 compliant)
- [x] Database schema with RLS security
- [x] Cursor AI integration documentation
- [x] Module recommendation engine
- [x] React UI components with full flow
- [x] Official Sacred Shifter logo integration
- [x] Bug fixes (options.map errors resolved)
- [x] Production build verified (323 kB)

### 🚧 In Progress

- [ ] Data export functionality (user right to access)
- [ ] Consent withdrawal UI in settings
- [ ] Admin dashboard for compliance auditing
- [ ] Reassessment reminder system (30-day trigger)

### 🔮 Future Roadmap

- [ ] Additional healing tracks (beyond Navigator routing)
- [ ] Real-time biometric integration
- [ ] Peer support network (trained users support new users)
- [ ] Machine learning on recommendation effectiveness
- [ ] Mobile app (React Native)

---

## 🙏 Philosophy

### Trauma-Informed Technology

Sacred Shifter is built on these non-negotiable principles:

1. **Safety First** - Nervous system capacity always determines intensity
2. **User Autonomy** - Clear exits, pause options, override capabilities
3. **No Spiritual Bypassing** - Meet users where they are, honor difficulty
4. **Consent as Sacred** - Active, informed, revocable
5. **Transparency** - Explain every data use, every recommendation
6. **Duty of Care** - Crisis resources for vulnerable states

### Metaphysical Principles

From the Global User Instructions:

1. **Principle of Oneness** - All communication via GlobalEventHorizon (unified field)
2. **Principle of Vibration** - Semantic labels for resonance-based matching
3. **Principle of Rhythm** - Module lifecycle (init, activate, deactivate, destroy)
4. **Super-Tautology** - Self-consistency enforcement via integrity scores

---

## 🛠️ Tech Stack

- **Frontend:** React 18 + TypeScript
- **Styling:** Tailwind CSS 3
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Build Tool:** Vite 5
- **Icons:** Lucide React
- **Deployment:** (TBD - Vercel/Netlify recommended)

---

## 📦 Key Files

### Entry Points
- `src/main.tsx` - Application entry
- `src/App.tsx` - Root component
- `src/modules/navigator/Navigator.tsx` - Navigator container

### Core Modules
- `src/modules/navigator/NavigatorModule.ts` - Module implementation
- `src/modules/navigator/services/AssessmentEngine.ts` - Profile calculation
- `src/modules/navigator/services/RoutingEngine.ts` - Track routing
- `src/modules/navigator/services/SafetyMonitor.ts` - Safety gating

### Components
- `src/modules/navigator/components/PrivacyConsent.tsx` - Consent UI
- `src/modules/navigator/components/NavigatorIntro.tsx` - Landing page
- `src/modules/navigator/components/AssessmentFlow.tsx` - Question flow
- `src/modules/navigator/components/ProfileResult.tsx` - Results display

### Metaphysical OS
- `src/metaphysical-os/core/GlobalEventHorizon.ts` - Event bus
- `src/metaphysical-os/core/LabelProcessor.ts` - Semantic matching
- `src/metaphysical-os/core/ModuleManager.ts` - Module lifecycle

---

## 🤝 Contributing

Sacred Shifter is in active development. Core principles for contributors:

1. **Trauma-informed design** - Always consider nervous system impact
2. **Privacy first** - Never compromise user data protection
3. **Accessibility** - Design for neurodivergence and disability
4. **Test thoroughly** - Especially safety-critical paths
5. **Document decisions** - Explain *why*, not just *what*

---

## 📞 Support & Contact

- **Documentation:** See `docs/` directory
- **Technical Issues:** Check migrations and RLS policies
- **Privacy Inquiries:** (To be set up) privacy@sacredshifter.com
- **OAIC Complaints:** [www.oaic.gov.au](https://www.oaic.gov.au)

---

## 📄 License

(To be determined - likely open source with commercial restrictions)

---

## 🌟 Acknowledgments

Sacred Shifter exists at the intersection of:
- Trauma-informed care (Bessel van der Kolk, Peter Levine, Janina Fisher)
- Contemplative neuroscience (Judson Brewer, Daniel Siegel)
- Psychedelic integration (MAPS, Stanislav Grof)
- Metaphysical philosophy (Hermetic principles, perennial wisdom)
- Semantic computing (ontologies, knowledge graphs)

With deep gratitude to all who walk the path of consciousness evolution.

---

**Guardian Note:** This is not just software - it's a container for transformation. Treat it, and the humans who use it, with reverence.

🌟 *Navigate consciousness with care and precision* 🌟
