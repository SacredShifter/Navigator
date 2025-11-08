import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { NavigatorQuestion } from '../../../types/navigator';
import { ScaleInput } from './ScaleInput';
import { MultiSelectInput } from './MultiSelectInput';
import { ProgressIndicator } from './ProgressIndicator';

interface AssessmentFlowProps {
  questions: NavigatorQuestion[];
  onSubmit: (responses: Map<string, any>) => void;
  onBack: () => void;
}

export function AssessmentFlow({ questions, onSubmit, onBack }: AssessmentFlowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState<Map<string, any>>(new Map());

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const currentResponse = responses.get(currentQuestion.id);

  const handleResponse = (answer: any) => {
    const newResponses = new Map(responses);
    newResponses.set(currentQuestion.id, answer);
    setResponses(newResponses);
  };

  const handleNext = () => {
    if (currentResponse === undefined) return;

    if (isLastQuestion) {
      onSubmit(responses);
    } else {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else {
      onBack();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <div className="max-w-3xl w-full">
        <ProgressIndicator
          current={currentIndex + 1}
          total={questions.length}
        />

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 mb-6">
          <div className="mb-8">
            <p className="text-sm text-blue-300 mb-2">
              Question {currentIndex + 1} of {questions.length}
            </p>
            <h2 className="text-3xl font-semibold text-white mb-6">
              {currentQuestion.question_text}
            </h2>

            {currentQuestion.input_type === 'scale' && (
              <ScaleInput
                options={currentQuestion.options}
                value={currentResponse}
                onChange={handleResponse}
              />
            )}

            {currentQuestion.input_type === 'multi' && (
              <MultiSelectInput
                options={currentQuestion.options}
                value={currentResponse}
                onChange={handleResponse}
              />
            )}
          </div>

          <div className="flex gap-4">
            <button
              onClick={handlePrevious}
              className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
              {currentIndex === 0 ? 'Back' : 'Previous'}
            </button>

            <button
              onClick={handleNext}
              disabled={currentResponse === undefined}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-xl transition-all"
            >
              {isLastQuestion ? 'Complete Assessment' : 'Next'}
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
