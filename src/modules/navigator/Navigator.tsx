import { useState, useEffect } from 'react';
import { NavigatorModule } from './NavigatorModule';
import { NavigatorIntro } from './components/NavigatorIntro';
import { AssessmentFlow } from './components/AssessmentFlow';
import { ProfileResult } from './components/ProfileResult';
import type { NavigatorQuestion, NavigatorProfile, ProfileScore, ChemicalState, RegulationLevel } from '../../types/navigator';

type NavigatorState = 'intro' | 'assessment' | 'result' | 'complete';

interface NavigatorProps {
  userId?: string;
  onComplete?: (trackId: string) => void;
}

export function Navigator({ userId, onComplete }: NavigatorProps) {
  const [state, setState] = useState<NavigatorState>('intro');
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

  useEffect(() => {
    const init = async () => {
      try {
        await navigatorModule.initialize();
        await navigatorModule.activate();
        setIsInitialized(true);
      } catch (error) {
        console.error('Error initializing Navigator:', error);
      }
    };
    init();

    return () => {
      navigatorModule.deactivate();
    };
  }, [navigatorModule]);

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

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
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
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
        <div className="text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Assessment Complete</h2>
          <p className="text-xl text-blue-200">
            Redirecting to your personalized track...
          </p>
        </div>
      </div>
    );
  }

  return null;
}
