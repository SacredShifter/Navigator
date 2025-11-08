import { useState, useEffect } from 'react';
import { NavigatorModule } from './NavigatorModule';
import { PrivacyConsent } from './components/PrivacyConsent';
import { NavigatorIntro } from './components/NavigatorIntro';
import { AssessmentFlow } from './components/AssessmentFlow';
import { ProfileResult } from './components/ProfileResult';
import type { NavigatorQuestion, NavigatorProfile, ProfileScore, ChemicalState, RegulationLevel } from '../../types/navigator';
import { supabase } from '../../lib/supabase';

type NavigatorState = 'privacy' | 'intro' | 'assessment' | 'result' | 'complete';

interface NavigatorProps {
  userId?: string;
  onComplete?: (trackId: string) => void;
}

export function Navigator({ userId, onComplete }: NavigatorProps) {
  const [state, setState] = useState<NavigatorState>('privacy');
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [hasConsent, setHasConsent] = useState(false);
  const [navigatorModule] = useState(() => new NavigatorModule());
  const [questions, setQuestions] = useState<NavigatorQuestion[]>([]);
  const [profile, setProfile] = useState<NavigatorProfile | null>(null);
  const [scores, setScores] = useState<ProfileScore[]>([]);
  const [chemicalState, setChemicalState] = useState<ChemicalState>('sober');
  const [regulationLevel, setRegulationLevel] = useState<RegulationLevel>('medium');
  const [targetTrackId, setTargetTrackId] = useState<string>('');
  const [safetyMode, setSafetyMode] = useState(false);
  const [safetyReason, setSafetyReason] = useState<string>();
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    const checkExistingConsent = async () => {
      if (!userId) return;

      const { data } = await supabase
        .from('user_onboarding_state')
        .select('consent_privacy_given')
        .eq('user_id', userId)
        .maybeSingle();

      if (data?.consent_privacy_given) {
        setHasConsent(true);
        setState('intro');
      }
    };

    checkExistingConsent();
  }, [userId]);

  useEffect(() => {
    if (!hasConsent && state === 'privacy') return;

    const init = async () => {
      try {
        await navigatorModule.initialize();
        await navigatorModule.activate();
        setIsInitialized(true);
      } catch (error) {
        console.error('Error initializing Navigator:', error);
        setInitError(error instanceof Error ? error.message : 'Failed to initialize Navigator');
      }
    };
    init();

    return () => {
      navigatorModule.deactivate();
    };
  }, [navigatorModule, hasConsent, state]);

  const handleConsentGiven = (granted: boolean) => {
    if (granted) {
      setHasConsent(true);
      setState('intro');
    }
  };

  const handleConsentDeclined = () => {
    if (onComplete) {
      onComplete('generic-experience');
    }
  };

  const handleBegin = async () => {
    try {
      const exposedItems = navigatorModule.getExposedItems();
      const assessment = exposedItems.assessmentAPI.startAssessment();

      if (assessment && assessment.questions && assessment.questions.length > 0) {
        setQuestions(assessment.questions);
        setState('assessment');
      } else {
        console.error('No questions loaded from assessment');
      }
    } catch (error) {
      console.error('Error starting assessment:', error);
    }
  };

  const handleSubmitAssessment = async (responses: Map<string, any>) => {
    const exposedItems = navigatorModule.getExposedItems();

    responses.forEach((answer, questionId) => {
      exposedItems.assessmentAPI.submitResponse(questionId, answer);
    });

    const result = exposedItems.assessmentAPI.calculateProfile();

    setProfile(result.profile);
    setScores(result.scores);
    setChemicalState(result.chemicalState);
    setRegulationLevel(result.regulationLevel);

    const route = exposedItems.routingEngine.getRouteForProfile(
      result.profile.id,
      result.chemicalState,
      result.regulationLevel
    );

    if (route) {
      setTargetTrackId(route.targetTrackId);
      setSafetyMode(route.safetyMode);
      setSafetyReason(route.safetyReason);

      navigatorModule.updateState(
        result.profile,
        result.chemicalState,
        result.regulationLevel
      );

      const riskAssessment = exposedItems.safetyMonitor.checkRisk(
        result.profile.name,
        result.chemicalState,
        result.regulationLevel
      );

      if (riskAssessment.riskLevel === 'high' || riskAssessment.riskLevel === 'critical') {
        exposedItems.safetyMonitor.activateSafetyMode();
      }

      if (userId) {
        await exposedItems.assessmentAPI.saveAssessment(
          userId,
          result.profile,
          result.scores,
          result.chemicalState,
          result.regulationLevel
        );

        await exposedItems.routingEngine.assignTrack(userId, route.targetTrackId);
      }
    }

    setState('result');
  };

  const handleContinue = () => {
    if (onComplete && targetTrackId) {
      onComplete(targetTrackId);
    }
    setState('complete');
  };

  const handleBack = () => {
    setState('intro');
  };

  if (initError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 p-4">
        <div className="text-center text-white max-w-md">
          <div className="text-2xl font-bold text-red-400 mb-4">Initialization Error</div>
          <div className="text-lg mb-4">{initError}</div>
          <div className="text-sm text-cyan-300">
            Please check your database connection and ensure all migrations have been applied.
          </div>
        </div>
      </div>
    );
  }

  if (state === 'privacy') {
    return (
      <PrivacyConsent
        onConsent={handleConsentGiven}
        onDecline={handleConsentDeclined}
        sessionId={sessionId}
      />
    );
  }

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 p-4">
        <div className="text-center text-white">
          <div className="text-xl">Initializing Navigator...</div>
        </div>
      </div>
    );
  }

  if (state === 'intro') {
    return <NavigatorIntro onBegin={handleBegin} />;
  }

  if (state === 'assessment') {
    if (questions.length === 0) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 p-4">
          <div className="text-center text-white">
            <div className="text-xl mb-4">Loading questions...</div>
          </div>
        </div>
      );
    }

    return (
      <AssessmentFlow
        questions={questions}
        onSubmit={handleSubmitAssessment}
        onBack={handleBack}
      />
    );
  }

  if (state === 'result' && profile) {
    return (
      <ProfileResult
        profile={profile}
        scores={scores}
        chemicalState={chemicalState}
        regulationLevel={regulationLevel}
        targetTrackId={targetTrackId}
        safetyMode={safetyMode}
        safetyReason={safetyReason}
        onContinue={handleContinue}
      />
    );
  }

  if (state === 'complete') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 p-4">
        <div className="text-center text-white">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-violet-400 via-cyan-400 to-violet-400 bg-clip-text text-transparent mb-4">Assessment Complete</h2>
          <p className="text-xl text-cyan-300">
            Redirecting to your personalized track...
          </p>
        </div>
      </div>
    );
  }

  return null;
}
