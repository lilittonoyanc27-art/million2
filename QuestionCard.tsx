import React, { useState } from 'react';
import { Question } from './types';
import { Languages, HelpCircle, CheckCircle2, XCircle, ArrowRight, Sparkles } from 'lucide-react';
import { soundManager } from './audio';

interface QuestionCardProps {
  question: Question;
  pointsToWin: number;
  onAnswerSelected: (isCorrect: boolean) => void;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  pointsToWin,
  onAnswerSelected
}) => {
  const [showArmenianTranslation, setShowArmenianTranslation] = useState<boolean>(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState<boolean>(false);

  const handleToggleTranslation = () => {
    soundManager.playClick();
    setShowArmenianTranslation(prev => !prev);
  };

  const handleSelectOption = (optionKey: string) => {
    if (hasAnswered) return;
    setSelectedOption(optionKey);
    setHasAnswered(true);

    const isCorrect = optionKey.toLowerCase() === question.correctAnswer.toLowerCase();
    if (isCorrect) {
      soundManager.playCorrect();
    } else {
      soundManager.playWrong();
    }

    // Auto reveal translation on answer to learn
    setShowArmenianTranslation(true);

    setTimeout(() => {
      onAnswerSelected(isCorrect);
    }, 1600);
  };

  return (
    <div className="w-full bg-slate-900/95 border-2 border-[#F9D423]/40 rounded-2xl p-5 md:p-6 shadow-[0_10px_30px_rgba(0,0,0,0.3)] backdrop-blur-lg flex flex-col gap-4 text-white animate-in zoom-in-95 duration-200" id="question-card">
      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-lg bg-[#FF4E50]/20 border border-[#FF4E50]/40 text-[#FF4E50] text-xs font-black uppercase tracking-wider">
            Հարց #{question.id}
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-[#F9D423]/15 border border-[#F9D423]/40 text-[#F9D423] text-xs font-bold">
            {question.category} ({question.categoryArm})
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-black text-slate-950 bg-[#F9D423] px-3.5 py-1 rounded-full border border-white shadow-sm">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Խաղադրույք: +{pointsToWin} միավոր</span>
        </div>
      </div>

      {/* Clickable Spanish Question box (Click to toggle Armenian translation) */}
      <div
        onClick={handleToggleTranslation}
        id={`question-prompt-${question.id}`}
        className="cursor-pointer group relative bg-gradient-to-r from-slate-800/90 to-slate-850 hover:from-slate-800 hover:to-slate-800 border-2 border-slate-700 hover:border-[#F9D423]/70 rounded-xl p-4 transition-all duration-200 shadow-md"
        title="Կտտացրեք հարցին՝ հայերեն թարգմանությունը բացելու համար"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <p className="text-lg md:text-xl font-black text-amber-200 leading-relaxed group-hover:text-[#F9D423] transition-colors">
              {question.spanish}
            </p>
          </div>
          <div className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-[#F9D423]/15 text-[#F9D423] border border-[#F9D423]/30 group-hover:bg-[#F9D423] group-hover:text-slate-950 transition-all shrink-0">
            <Languages className="w-3.5 h-3.5" />
            <span>{showArmenianTranslation ? 'Թաքցնել թարգմանությունը' : 'Հայերեն թարգմանություն'}</span>
          </div>
        </div>

        {/* Armenian Translation view */}
        {showArmenianTranslation ? (
          <div className="mt-3 pt-3 border-t border-slate-700/80 text-emerald-300 text-sm md:text-base font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200 bg-emerald-950/40 p-2.5 rounded-lg border border-emerald-500/40">
            <span className="text-emerald-400 text-xs uppercase font-black tracking-wider shrink-0">🇦🇲 Հայերեն:</span>
            <span>{question.armenian}</span>
          </div>
        ) : (
          <p className="mt-2 text-xs text-slate-400 group-hover:text-slate-300 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-[#F9D423]" />
            <span>Կտտացրեք այստեղ՝ հայերեն թարգմանությունը տեսնելու համար (Click for Armenian translation)</span>
          </p>
        )}
      </div>

      {/* Answer Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-1">
        {question.options.map((opt, index) => {
          // Extract letter key e.g. "a" from "a) hablo"
          const optKey = opt.trim().charAt(0).toLowerCase();
          const isCorrect = optKey === question.correctAnswer.toLowerCase();
          const isSelected = selectedOption === optKey;

          let btnStyle = 'bg-slate-800 hover:bg-slate-700 border-slate-700 hover:border-[#F9D423] text-slate-100';
          if (hasAnswered) {
            if (isCorrect) {
              btnStyle = 'bg-emerald-900/90 border-emerald-400 text-emerald-100 ring-2 ring-emerald-400 shadow-lg font-black';
            } else if (isSelected && !isCorrect) {
              btnStyle = 'bg-rose-950/90 border-rose-500 text-rose-200 ring-2 ring-rose-500';
            } else {
              btnStyle = 'bg-slate-800/40 border-slate-800 text-slate-500 opacity-50';
            }
          }

          return (
            <button
              key={index}
              id={`option-btn-${optKey}`}
              onClick={() => handleSelectOption(optKey)}
              disabled={hasAnswered}
              className={`p-3.5 rounded-xl border-2 font-bold text-left text-sm md:text-base flex items-center justify-between transition-all transform active:scale-98 cursor-pointer ${btnStyle}`}
            >
              <span>{opt}</span>
              {hasAnswered && isCorrect && (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              )}
              {hasAnswered && isSelected && !isCorrect && (
                <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {/* Status Feedback */}
      {hasAnswered && (
        <div
          className={`p-3 rounded-xl text-center text-sm font-bold animate-in fade-in duration-300 flex items-center justify-center gap-2 ${
            selectedOption === question.correctAnswer.toLowerCase()
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
          }`}
        >
          {selectedOption === question.correctAnswer.toLowerCase() ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Ճիշտ է! +{pointsToWin} միավոր: Այժմ կարող եք ընտրել տառ կամ ասել բառը:</span>
            </>
          ) : (
            <>
              <XCircle className="w-4 h-4 text-rose-400" />
              <span>Սխալ պատասխան: Ճիշտ պատասխանն է: {question.correctAnswer.toUpperCase()}</span>
            </>
          )}
        </div>
      )}
    </div>
  );
};
