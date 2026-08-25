import React, { useState } from 'react';
import { Question } from './types';
import { ALL_QUESTIONS } from './questions';
import { X, Languages, Search, BookOpen, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { soundManager } from './audio';

interface QuestionsReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuestionsReviewModal: React.FC<QuestionsReviewModalProps> = ({ isOpen, onClose }) => {
  const [search, setSearch] = useState('');
  const [selectedVerb, setSelectedVerb] = useState<string>('ALL');
  const [openedTranslations, setOpenedTranslations] = useState<Record<number, boolean>>({});

  if (!isOpen) return null;

  const toggleTranslation = (id: number) => {
    soundManager.playClick();
    setOpenedTranslations(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const verbs = ['ALL', 'HABLAR', 'COMER', 'VIVIR', 'SER', 'ESTAR', 'SER o ESTAR', 'Mezcla final'];

  const filteredQuestions = ALL_QUESTIONS.filter(q => {
    const matchesVerb = selectedVerb === 'ALL' || q.category.includes(selectedVerb);
    const matchesSearch =
      q.spanish.toLowerCase().includes(search.toLowerCase()) ||
      q.armenian.toLowerCase().includes(search.toLowerCase()) ||
      q.id.toString().includes(search);
    return matchesVerb && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border-2 border-[#F9D423]/50 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#F9D423] text-slate-950 shadow-md">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                Բոլոր 54 հարցերի շտեմարան
                <span className="text-xs font-black text-slate-950 bg-[#F9D423] px-2.5 py-0.5 rounded-full border border-white">
                  54 preguntas
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                Կտտացրեք ցանկացած հարցի վրա՝ հայերեն թարգմանությունը բացելու համար
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            id="close-questions-modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Filter and Search Bar */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/90 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Փնտրել իսպաներեն կամ հայերեն բառերով..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-800/90 border-2 border-slate-700 focus:border-[#F9D423] rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none transition-colors"
            />
          </div>

          {/* Verb Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {verbs.map(v => (
              <button
                key={v}
                onClick={() => {
                  soundManager.playClick();
                  setSelectedVerb(v);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer shadow-sm ${
                  selectedVerb === v
                    ? 'bg-[#F9D423] text-slate-950 shadow-[0_0_12px_rgba(249,212,35,0.4)] border border-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                }`}
              >
                {v === 'ALL' ? 'Բոլորը (54)' : v}
              </button>
            ))}
          </div>
        </div>

        {/* Questions list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-slate-800/50">
          {filteredQuestions.map(q => {
            const isArmenianOpen = !!openedTranslations[q.id];

            return (
              <div
                key={q.id}
                onClick={() => toggleTranslation(q.id)}
                className="pt-3 first:pt-0 group cursor-pointer"
                id={`review-question-${q.id}`}
              >
                <div className="p-4 rounded-2xl bg-slate-800/60 hover:bg-slate-800 border-2 border-slate-700/80 hover:border-[#F9D423]/60 transition-all shadow-md">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-[#FF4E50]/20 text-[#FF4E50] font-black text-xs flex items-center justify-center border border-[#FF4E50]/30 shrink-0">
                        #{q.id}
                      </span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#F9D423]/20 text-[#F9D423]">
                        {q.category} ({q.categoryArm})
                      </span>
                      {q.id <= 27 ? (
                        <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded border border-amber-500/30">
                          Խաղացող 1 (Փուլ 1)
                        </span>
                      ) : (
                        <span className="text-[10px] bg-purple-500/20 text-purple-300 font-bold px-2 py-0.5 rounded border border-purple-500/30">
                          Խաղացող 2 (Փուլ 2)
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 text-xs text-[#F9D423] font-bold group-hover:text-amber-200">
                      <Languages className="w-3.5 h-3.5" />
                      <span>{isArmenianOpen ? 'Թաքցնել' : 'Թարգմանություն'}</span>
                      {isArmenianOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </div>
                  </div>

                  {/* Spanish Text */}
                  <p className="mt-2.5 text-base font-black text-slate-100 group-hover:text-[#F9D423] transition-colors">
                    {q.spanish}
                  </p>

                  {/* Armenian Translation */}
                  {isArmenianOpen ? (
                    <div className="mt-2.5 p-3 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-sm font-bold animate-in fade-in duration-200">
                      🇦🇲 {q.armenian}
                    </div>
                  ) : (
                    <p className="mt-1.5 text-xs text-slate-400 italic">
                      Կտտացրեք թարգմանությունը դիտելու համար...
                    </p>
                  )}

                  {/* Options */}
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {q.options.map((opt, i) => {
                      const optKey = opt.trim().charAt(0).toLowerCase();
                      const isCorrect = optKey === q.correctAnswer.toLowerCase();
                      return (
                        <div
                          key={i}
                          className={`p-2.5 rounded-xl text-xs font-bold border-2 ${
                            isCorrect
                              ? 'bg-emerald-900/60 border-emerald-400 text-emerald-200 font-black ring-1 ring-emerald-400'
                              : 'bg-slate-900/60 border-slate-700/60 text-slate-300'
                          }`}
                        >
                          {opt} {isCorrect && '✓'}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}

          {filteredQuestions.length === 0 && (
            <div className="py-12 text-center text-slate-400 font-medium">
              Հարցեր չեն գտնվել տրված որոնմամբ
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
