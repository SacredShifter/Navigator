/**
 * Supporter Tier Modal - Pay-What-You-Can Premium
 *
 * Ethical monetization: Users choose what they can afford ($3-$50/mo)
 * All revenue keeps core safety features free for everyone.
 */

import { useState } from 'react';
import { X, Heart, Sparkles, TrendingUp, Users, Brain, CheckCircle } from 'lucide-react';

interface SupporterTierModalProps {
  onClose: () => void;
  onSubscribe?: (amount: number) => void;
}

export function SupporterTierModal({ onClose, onSubscribe }: SupporterTierModalProps) {
  const [selectedAmount, setSelectedAmount] = useState(7);
  const [customAmount, setCustomAmount] = useState('');

  const presetAmounts = [3, 7, 15, 25, 50];

  const handleSubscribe = () => {
    const amount = customAmount ? parseFloat(customAmount) : selectedAmount;
    if (onSubscribe) {
      onSubscribe(amount);
    }
    alert(`Thank you for supporting Sacred Shifter Connect at $${amount}/month! Payment integration coming soon.`);
    onClose();
  };

  const supporterFeatures = [
    {
      icon: Sparkles,
      title: 'AI Journey Summaries',
      description: 'Weekly narrative synthesis of your patterns and progress',
      color: 'text-purple-400'
    },
    {
      icon: Brain,
      title: 'ML Pattern Recognition',
      description: 'Discover your journey archetype and get personalized interventions',
      color: 'text-blue-400'
    },
    {
      icon: TrendingUp,
      title: 'Trajectory Predictions',
      description: '7-30 day RI forecasting with confidence intervals',
      color: 'text-green-400'
    },
    {
      icon: Users,
      title: 'Priority Cohort Matching',
      description: 'Get matched to cohorts 2x faster with better compatibility',
      color: 'text-pink-400'
    }
  ];

  const alwaysFreeFeatures = [
    'Crisis detection & alerts',
    'Professional referral network',
    'Anonymous community cohorts',
    'Basic reality branch tracking',
    'Safety resources & hotlines'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-gray-700 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-b border-gray-700 p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-light text-gray-100 mb-2">
                Become a Supporter
              </h2>
              <p className="text-gray-400 text-sm">
                Pay what you can. Help keep Sacred Shifter free for everyone.
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-200 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* Supporter Features */}
          <div>
            <h3 className="text-lg font-medium text-gray-200 mb-4 flex items-center space-x-2">
              <Heart className="w-5 h-5 text-red-400" />
              <span>Supporter Features</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {supporterFeatures.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={index}
                    className="bg-gray-900/50 rounded-lg p-4 border border-gray-700"
                  >
                    <Icon className={`w-6 h-6 ${feature.color} mb-2`} />
                    <h4 className="text-sm font-medium text-gray-200 mb-1">
                      {feature.title}
                    </h4>
                    <p className="text-xs text-gray-400">
                      {feature.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Always Free Notice */}
          <div className="bg-green-600/10 border border-green-500/30 rounded-lg p-4">
            <h3 className="text-sm font-medium text-green-400 mb-3">
              Always Free for Everyone:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {alwaysFreeFeatures.map((feature, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-xs text-gray-300">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pay What You Can */}
          <div>
            <h3 className="text-lg font-medium text-gray-200 mb-4">
              Choose Your Support Level
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              Select a preset amount or enter your own. Every dollar helps keep this platform
              accessible to those who need it most.
            </p>

            {/* Preset Amounts */}
            <div className="grid grid-cols-5 gap-2 mb-4">
              {presetAmounts.map((amount) => (
                <button
                  key={amount}
                  onClick={() => {
                    setSelectedAmount(amount);
                    setCustomAmount('');
                  }}
                  className={`
                    py-3 px-2 rounded-lg border transition-all
                    ${selectedAmount === amount && !customAmount
                      ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                      : 'bg-gray-900/50 border-gray-700 text-gray-300 hover:border-gray-600'
                    }
                  `}
                >
                  <div className="text-lg font-medium">${amount}</div>
                  <div className="text-xs text-gray-500">/month</div>
                </button>
              ))}
            </div>

            {/* Custom Amount */}
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
              <input
                type="number"
                min="3"
                max="1000"
                step="1"
                value={customAmount}
                onChange={(e) => {
                  setCustomAmount(e.target.value);
                  setSelectedAmount(0);
                }}
                placeholder="Enter custom amount (min $3)"
                className="w-full bg-gray-900/50 border border-gray-700 rounded-lg pl-8 pr-4 py-3 text-gray-200 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <p className="text-xs text-gray-500 mt-2">
              Minimum $3/month • Cancel anytime • 100% of proceeds support platform operations
            </p>
          </div>

          {/* Subscribe Button */}
          <button
            onClick={handleSubscribe}
            disabled={!selectedAmount && !customAmount}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-700 disabled:to-gray-700 text-white font-medium py-4 rounded-lg transition-all disabled:cursor-not-allowed"
          >
            {customAmount
              ? `Support with $${customAmount}/month`
              : selectedAmount
              ? `Support with $${selectedAmount}/month`
              : 'Select an amount to continue'
            }
          </button>

          {/* Impact Statement */}
          <div className="text-center">
            <p className="text-sm text-gray-400">
              Your support helps us keep crisis detection, safety resources, and professional
              referrals <span className="text-green-400 font-medium">free for everyone</span>,
              regardless of their ability to pay.
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Sacred Shifter Connect is committed to accessible mental health support for all.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
