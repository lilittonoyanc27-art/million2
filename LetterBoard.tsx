import React from 'react';
import { Sparkles, HelpCircle } from 'lucide-react';

interface LetterBoardProps {
  targetWord: string; // e.g. 'ENTRENADOR' or 'VERDURAS'
  revealedLetters: string[];
  isPlusSectorActive?: boolean;
  onSelectLetterToReveal?: (letter: string) => void;
  categoryHint: string;
  categoryHintArm: string;
}

export const LetterBoard: React.FC<LetterBoardProps> = ({
  targetWord,
  revealedLetters,
  isPlusSectorActive = false,
  onSelectLetterToReveal,
  categoryHint,
  categoryHintArm
}) => {
  const letters = targetWord.toUpperCase().split('');

  return (
    <div className="w-full flex flex-col items-center justify-center p-5 sm:p-6 bg-slate-900/90 backdrop-blur-md border-2 border-[#F9D423]/50 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.3)] relative overflow-hidden" id="letter-board">
      {/* Decorative Golden Stage Lights */}
      <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[#FF4E50] via-[#F9D423] to-[#FF4E50] shadow-[0_0_15px_#F9D423]"></div>
      
      {/* Category / Clue Title */}
      <div className="text-center mb-4 sm:mb-5">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#F9D423]/15 border border-[#F9D423]/40 text-[#F9D423] text-xs font-bold uppercase tracking-wider mb-1.5 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-[#F9D423]" />
          <span>Գլխավոր թաքնված բառը / Главное слово</span>
        </div>
        <p className="text-sm md:text-base text-white/90 font-medium">
          {categoryHint}{categoryHintArm ? ' — ' : ''}
          {categoryHintArm && <span className="text-[#F9D423] font-black">{categoryHintArm}</span>}
        </p>
        {isPlusSectorActive && (
          <div className="mt-2.5 text-xs md:text-sm font-black text-slate-950 animate-bounce bg-[#F9D423] px-4 py-1.5 rounded-full border-2 border-white inline-block shadow-lg">
            ⭐ Сектор Плюс! Կտտացրեք ցանկացած փակ վանդակի՝ տառը բացելու համար:
          </div>
        )}
      </div>

      {/* Letters row */}
      <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3 max-w-full my-2">
        {letters.map((char, index) => {
          const isRevealed = revealedLetters.includes(char);
          const isClickable = isPlusSectorActive && !isRevealed;

          return (
            <div
              key={index}
              id={`letter-cell-${index}`}
              onClick={() => {
                if (isClickable && onSelectLetterToReveal) {
                  onSelectLetterToReveal(char);
                }
              }}
              className={`relative select-none transition-all duration-300 transform ${
                isClickable
                  ? 'cursor-pointer hover:scale-110 ring-4 ring-[#F9D423] hover:ring-white animate-pulse'
                  : ''
              }`}
            >
              {/* Card Container */}
              <div
                className={`w-10 h-14 sm:w-13 sm:h-18 md:w-16 md:h-22 rounded-xl flex items-center justify-center font-black text-2xl sm:text-3xl md:text-4xl shadow-xl transition-all duration-500 border-2 ${
                  isRevealed
                    ? 'bg-gradient-to-b from-[#FFF5C0] via-[#F9D423] to-[#F59E0B] text-slate-950 border-[#F9D423] shadow-[0_0_25px_rgba(249,212,35,0.6)] rotate-y-0 scale-102'
                    : 'bg-gradient-to-b from-slate-800 to-slate-950 text-slate-400 border-slate-700 hover:border-[#F9D423]/60'
                }`}
              >
                {isRevealed ? (
                  <span className="animate-in fade-in zoom-in duration-300 text-slate-950 drop-shadow-sm font-black">
                    {char}
                  </span>
                ) : (
                  <div className="w-full h-full flex items-center justify-center opacity-40">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md border border-slate-600 flex items-center justify-center text-xs text-slate-300 font-mono font-bold">
                      {index + 1}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress count */}
      <div className="mt-4 text-xs text-slate-300 flex items-center gap-3 sm:gap-4 bg-black/30 px-4 py-1.5 rounded-full border border-white/10">
        <span>Բացված տառեր: <strong className="text-[#F9D423]">{revealedLetters.filter(l => letters.includes(l)).length}</strong> / {letters.length}</span>
        <span className="text-white/30">•</span>
        <span>Բառի երկարությունը: <strong className="text-white font-bold">{letters.length}</strong> տառ</span>
      </div>
    </div>
  );
};
