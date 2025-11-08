import { useState } from 'react';
import { Plus, Check, X } from 'lucide-react';

interface TinyAction {
  insight: string;
  trigger: string;
  action: string;
  proof: string;
}

interface TinyActionBuilderProps {
  onSave: (actions: TinyAction[]) => void;
  onComplete?: () => void;
}

export function TinyActionBuilder({ onSave, onComplete }: TinyActionBuilderProps) {
  const [actions, setActions] = useState<TinyAction[]>([]);
  const [currentAction, setCurrentAction] = useState<Partial<TinyAction>>({});
  const [step, setStep] = useState<'insight' | 'trigger' | 'action' | 'proof'>('insight');

  const handleNext = () => {
    if (step === 'insight' && currentAction.insight) {
      setStep('trigger');
    } else if (step === 'trigger' && currentAction.trigger) {
      setStep('action');
    } else if (step === 'action' && currentAction.action) {
      setStep('proof');
    } else if (step === 'proof' && currentAction.proof) {
      const newAction = currentAction as TinyAction;
      const updatedActions = [...actions, newAction];
      setActions(updatedActions);
      onSave(updatedActions);
      setCurrentAction({});
      setStep('insight');
    }
  };

  const handleComplete = () => {
    if (actions.length > 0) {
      onComplete?.();
    }
  };

  const removeAction = (index: number) => {
    const updated = actions.filter((_, i) => i !== index);
    setActions(updated);
    onSave(updated);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white/5 rounded-xl p-6 border border-white/10">
        <h3 className="text-xl font-semibold text-white mb-4">
          Create Your Tiny Actions
        </h3>

        {step === 'insight' && (
          <div className="space-y-3">
            <label className="block text-blue-200">
              What actually matters from this session?
            </label>
            <textarea
              value={currentAction.insight || ''}
              onChange={(e) => setCurrentAction({ ...currentAction, insight: e.target.value })}
              placeholder="One key insight..."
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-400 focus:outline-none focus:border-blue-400"
              rows={3}
            />
          </div>
        )}

        {step === 'trigger' && (
          <div className="space-y-3">
            <label className="block text-blue-200">
              When/Where will you do this? (Trigger)
            </label>
            <input
              type="text"
              value={currentAction.trigger || ''}
              onChange={(e) => setCurrentAction({ ...currentAction, trigger: e.target.value })}
              placeholder="When I make coffee..."
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-400 focus:outline-none focus:border-blue-400"
            />
            <p className="text-sm text-blue-300">Example: When I wake up or After lunch</p>
          </div>
        )}

        {step === 'action' && (
          <div className="space-y-3">
            <label className="block text-blue-200">
              What will you do? (Action - under 2 minutes)
            </label>
            <input
              type="text"
              value={currentAction.action || ''}
              onChange={(e) => setCurrentAction({ ...currentAction, action: e.target.value })}
              placeholder="3 cycles of 4-6 breathing..."
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-400 focus:outline-none focus:border-blue-400"
            />
            <p className="text-sm text-blue-300">Keep it tiny - under 2 minutes</p>
          </div>
        )}

        {step === 'proof' && (
          <div className="space-y-3">
            <label className="block text-blue-200">
              How will you know you did it? (Proof)
            </label>
            <input
              type="text"
              value={currentAction.proof || ''}
              onChange={(e) => setCurrentAction({ ...currentAction, proof: e.target.value })}
              placeholder="Mark ☑ in app..."
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-400 focus:outline-none focus:border-blue-400"
            />
            <p className="text-sm text-blue-300">Example: Check box in app or Text a friend</p>
          </div>
        )}

        <button
          onClick={handleNext}
          disabled={!currentAction[step]}
          className="w-full mt-4 px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all"
        >
          {step === 'proof' ? 'Save Action' : 'Next'}
        </button>
      </div>

      {actions.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-lg font-semibold text-white">Your Tiny Actions</h4>
          {actions.map((action, index) => (
            <div
              key={index}
              className="bg-green-500/10 border border-green-500/30 rounded-lg p-4"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <p className="text-white font-medium">{action.insight}</p>
                </div>
                <button
                  onClick={() => removeAction(index)}
                  className="text-red-400 hover:text-red-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="ml-7 space-y-1 text-sm text-blue-200">
                <p><span className="font-medium">When:</span> {action.trigger}</p>
                <p><span className="font-medium">Do:</span> {action.action}</p>
                <p><span className="font-medium">Proof:</span> {action.proof}</p>
              </div>
            </div>
          ))}

          <button
            onClick={handleComplete}
            className="w-full px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
          >
            <Check className="w-5 h-5" />
            Complete Integration
          </button>
        </div>
      )}

      {actions.length > 0 && actions.length < 3 && (
        <button
          onClick={() => {
            setCurrentAction({});
            setStep('insight');
          }}
          className="w-full px-6 py-3 bg-white/10 hover:bg-white/20 text-blue-200 font-medium rounded-lg transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Another Action
        </button>
      )}
    </div>
  );
}
