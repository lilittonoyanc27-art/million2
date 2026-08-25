/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Volume2,
  VolumeX,
  Trophy,
  Users,
  RotateCcw,
  Sparkles,
  HelpCircle,
  BookOpen,
  Award,
  ChevronRight,
  Send,
  Zap,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { PlayerStats, Question, WheelSector, GamePhase } from './types';
import { ALL_QUESTIONS, PLAYER_1_QUESTIONS, PLAYER_2_QUESTIONS } from './questions';
import { Wheel } from './Wheel';
import { LetterBoard } from './LetterBoard';
import { QuestionCard } from './QuestionCard';
import { QuestionsReviewModal } from './QuestionsReviewModal';
import { soundManager } from './audio';

const SPANISH_ALPHABET = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J',
  'K', 'L', 'M', 'N', 'Ñ', 'O', 'P', 'Q', 'R', 'S',
  'T', 'U', 'V', 'W', 'X', 'Y', 'Z'
];

export default function App() {
  // Sound Mute State
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Questions Review Modal
  const [isReviewOpen, setIsReviewOpen] = useState<boolean>(false);

  // Guess full word modal
  const [isGuessWordModalOpen, setIsGuessWordModalOpen] = useState<boolean>(false);
  const [fullWordInput, setFullWordInput] = useState<string>('');
  const [guessErrorMsg, setGuessErrorMsg] = useState<string | null>(null);

  // Active Player (1 or 2)
  const [activePlayerId, setActivePlayerId] = useState<1 | 2>(1);

  // Game Phases
  const [phase, setPhase] = useState<GamePhase>('player1_play');

  // Player 1 State (Word: ENTRENADOR, Questions 1-27)
  const [player1, setPlayer1] = useState<PlayerStats>({
    id: 1,
    name: 'Խաղացող 1 (Игрок 1)',
    nameArm: 'Առաջին մասնակից',
    targetWord: 'ENTRENADOR',
    targetWordArmMeaning: '',
    targetWordCategory: 'Թեմա՝ Մասնագիտություն / Тема: Профессия',
    score: 0,
    revealedLetters: [],
    correctAnswersCount: 0,
    totalQuestionsAnswered: 0,
    spinsCount: 0,
    isCompleted: false,
    usedQuestionIds: []
  });

  // Player 2 State (Word: VERDURAS, Questions 28-54)
  const [player2, setPlayer2] = useState<PlayerStats>({
    id: 2,
    name: 'Խաղացող 2 (Игрок 2)',
    nameArm: 'Երկրորդ մասնակից',
    targetWord: 'VERDURAS',
    targetWordArmMeaning: '',
    targetWordCategory: 'Թեմա՝ Բնություն և սնունդ / Тема: Еда',
    score: 0,
    revealedLetters: [],
    correctAnswersCount: 0,
    totalQuestionsAnswered: 0,
    spinsCount: 0,
    isCompleted: false,
    usedQuestionIds: []
  });

  // Current Turn State
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [currentSector, setCurrentSector] = useState<WheelSector | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [turnStep, setTurnStep] = useState<'spin' | 'question' | 'pick_letter' | 'plus_letter'>('spin');
  const [statusMessage, setStatusMessage] = useState<string>('Պտտեք բարաբանը խաղը սկսելու համար!');

  // Handle Mute toggle
  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    soundManager.setMuted(nextMuted);
    if (!nextMuted) {
      soundManager.playClick();
    }
  };

  const currentPlayer = activePlayerId === 1 ? player1 : player2;
  const targetQuestionsPool = activePlayerId === 1 ? PLAYER_1_QUESTIONS : PLAYER_2_QUESTIONS;

  // Check if current word is solved
  const checkWordSolved = (revealedLetters: string[], word: string) => {
    const uniqueChars = Array.from(new Set(word.toUpperCase().split('')));
    return uniqueChars.every(c => revealedLetters.includes(c));
  };

  // Trigger celebration confetti
  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch {
      // fallback
    }
  };

  // Get an unused question for current player
  const getNextQuestion = (usedIds: number[]): Question => {
    const remaining = targetQuestionsPool.filter(q => !usedIds.includes(q.id));
    if (remaining.length > 0) {
      const randIdx = Math.floor(Math.random() * remaining.length);
      return remaining[randIdx];
    }
    // If all used, pick any from pool
    const randIdx = Math.floor(Math.random() * targetQuestionsPool.length);
    return targetQuestionsPool[randIdx];
  };

  // Wheel Spin Completed
  const handleSpinComplete = (sector: WheelSector) => {
    setIsSpinning(false);
    setCurrentSector(sector);

    const updateSpins = (prev: PlayerStats) => ({ ...prev, spinsCount: prev.spinsCount + 1 });
    if (activePlayerId === 1) setPlayer1(updateSpins);
    else setPlayer2(updateSpins);

    if (sector.type === 'plus') {
      // Sector Plus: user chooses any letter from board
      setTurnStep('plus_letter');
      setStatusMessage('⭐ Сектор Плюс! Կտտացրեք տախտակի ցանկացած փակ վանդակի՝ տառը բացելու համար:');
    } else if (sector.type === 'bonus') {
      // Sector Bonus: Add points + choose letter
      const bonusPts = sector.value;
      const addPts = (prev: PlayerStats) => ({ ...prev, score: prev.score + bonusPts });
      if (activePlayerId === 1) setPlayer1(addPts);
      else setPlayer2(addPts);

      setTurnStep('pick_letter');
      setStatusMessage(`🎁 Պարգև! Դուք ստացաք +${bonusPts} միավոր: Ընտրեք տառ ստեղնաշարից կամ ասեք բառը:`);
    } else {
      // Standard Question Turn (Points, Double, Chance)
      const q = getNextQuestion(currentPlayer.usedQuestionIds);
      setCurrentQuestion(q);
      setTurnStep('question');
      setStatusMessage(`Բարաբանը ցույց է տալիս: ${sector.label} միավոր: Պատասխանեք հարցին!`);
    }
  };

  // Handle Question Answer
  const handleQuestionAnswer = (isCorrect: boolean) => {
    if (!currentQuestion || !currentSector) return;

    const questionId = currentQuestion.id;
    let earnedPoints = 0;

    if (isCorrect) {
      if (currentSector.type === 'double') {
        earnedPoints = Math.max(currentPlayer.score, 300);
      } else {
        earnedPoints = currentSector.value || 300;
      }
    }

    // Update Player Stats
    const updateStats = (prev: PlayerStats) => ({
      ...prev,
      score: prev.score + earnedPoints,
      correctAnswersCount: prev.correctAnswersCount + (isCorrect ? 1 : 0),
      totalQuestionsAnswered: prev.totalQuestionsAnswered + 1,
      usedQuestionIds: prev.usedQuestionIds.includes(questionId)
        ? prev.usedQuestionIds
        : [...prev.usedQuestionIds, questionId]
    });

    if (activePlayerId === 1) setPlayer1(updateStats);
    else setPlayer2(updateStats);

    if (isCorrect) {
      setTurnStep('pick_letter');
      setStatusMessage(`👏 Ճիշտ է (+${earnedPoints} միավոր)! Այժմ ընտրեք տառ կամ ասեք ամբողջ բառը:`);
    } else {
      setTurnStep('spin');
      setCurrentQuestion(null);
      setCurrentSector(null);
      setStatusMessage(`❌ Սխալ պատասխան: Միավորներ չեն տրվում: Պտտեք բարաբանը նորից!`);
    }
  };

  // Handle Letter Pick from Virtual Keyboard
  const handlePickLetter = (letter: string) => {
    if (turnStep !== 'pick_letter' && turnStep !== 'plus_letter') return;
    const char = letter.toUpperCase();

    if (currentPlayer.revealedLetters.includes(char)) {
      return;
    }

    const targetWord = currentPlayer.targetWord.toUpperCase();
    const countInWord = targetWord.split('').filter(c => c === char).length;

    if (countInWord > 0) {
      soundManager.playLetterOpen();
      const updatedRevealed = [...currentPlayer.revealedLetters, char];
      const letterPoints = countInWord * 200;

      const updatePlayer = (prev: PlayerStats) => ({
        ...prev,
        revealedLetters: updatedRevealed,
        score: prev.score + letterPoints
      });

      if (activePlayerId === 1) setPlayer1(updatePlayer);
      else setPlayer2(updatePlayer);

      setStatusMessage(`🎉 Բացվեց «${char}» տառը (${countInWord} հատ, +${letterPoints} միավոր)!`);

      // Check if word is completely solved
      if (checkWordSolved(updatedRevealed, targetWord)) {
        handleRoundWon();
        return;
      }
    } else {
      soundManager.playWrong();
      const updatedRevealed = [...currentPlayer.revealedLetters, char];
      const updatePlayer = (prev: PlayerStats) => ({
        ...prev,
        revealedLetters: updatedRevealed
      });

      if (activePlayerId === 1) setPlayer1(updatePlayer);
      else setPlayer2(updatePlayer);

      setStatusMessage(`«${char}» տառը բառի մեջ չկա: Պտտեք բարաբանը հաջորդ հարցի համար:`);
    }

    setTurnStep('spin');
    setCurrentQuestion(null);
    setCurrentSector(null);
  };

  // Handle Plus Sector Direct Box Click
  const handlePlusLetterReveal = (letter: string) => {
    handlePickLetter(letter);
  };

  // Handle Guessing the Entire Word
  const handleGuessFullWord = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanGuess = fullWordInput.trim().toUpperCase();
    const targetWord = currentPlayer.targetWord.toUpperCase();

    if (!cleanGuess) {
      setGuessErrorMsg('Խնդրում ենք մուտքագրել բառը');
      return;
    }

    if (cleanGuess === targetWord) {
      // Correct!
      soundManager.playCorrect();
      setIsGuessWordModalOpen(false);
      setFullWordInput('');
      setGuessErrorMsg(null);

      // Reveal all letters
      const allUniqueLetters = Array.from(new Set(targetWord.split('')));
      const bonusPts = 1500;

      const updatePlayer = (prev: PlayerStats) => ({
        ...prev,
        revealedLetters: allUniqueLetters,
        score: prev.score + bonusPts
      });

      if (activePlayerId === 1) setPlayer1(updatePlayer);
      else setPlayer2(updatePlayer);

      setStatusMessage(`🏆 ՀԻԱՆԱԼԻ Է! Դուք ճիշտ գուշակեցիք «${targetWord}» բառը (+${bonusPts} բոնուս)!`);
      handleRoundWon();
    } else {
      soundManager.playWrong();
      setGuessErrorMsg(`❌ «${cleanGuess}» բառը ճիշտ չէ: Խաղը շարունակվում է:`);
      setTimeout(() => {
        setIsGuessWordModalOpen(false);
        setGuessErrorMsg(null);
        setFullWordInput('');
        setTurnStep('spin');
        setCurrentQuestion(null);
        setCurrentSector(null);
      }, 1800);
    }
  };

  // Round Won by Current Player
  const handleRoundWon = () => {
    soundManager.playFanfare();
    triggerConfetti();

    if (activePlayerId === 1) {
      setPlayer1(prev => ({ ...prev, isCompleted: true }));
      setPhase('round1_complete');
    } else {
      setPlayer2(prev => ({ ...prev, isCompleted: true }));
      setPhase('game_over');
    }
  };

  // Start Player 2's turn
  const handleStartPlayer2 = () => {
    soundManager.playClick();
    setActivePlayerId(2);
    setPhase('player2_play');
    setTurnStep('spin');
    setCurrentQuestion(null);
    setCurrentSector(null);
    setStatusMessage('Խաղացող 2, պտտեք բարաբանը և գուշակեք ձեր բառը!');
  };

  // Restart Entire Game
  const handleRestartGame = () => {
    soundManager.playClick();
    setActivePlayerId(1);
    setPhase('player1_play');
    setTurnStep('spin');
    setCurrentQuestion(null);
    setCurrentSector(null);
    setStatusMessage('Պտտեք բարաբանը խաղը սկսելու համար!');

    setPlayer1({
      id: 1,
      name: 'Խաղացող 1 (Игрок 1)',
      nameArm: 'Առաջին մասնակից',
      targetWord: 'ENTRENADOR',
      targetWordArmMeaning: 'Մարզիչ / Тренер',
      targetWordCategory: 'Մասնագիտություն / Профессия',
      score: 0,
      revealedLetters: [],
      correctAnswersCount: 0,
      totalQuestionsAnswered: 0,
      spinsCount: 0,
      isCompleted: false,
      usedQuestionIds: []
    });

    setPlayer2({
      id: 2,
      name: 'Խաղացող 2 (Игрок 2)',
      nameArm: 'Երկրորդ մասնակից',
      targetWord: 'VERDURAS',
      targetWordArmMeaning: 'Բանջարեղեն / Овощи',
      targetWordCategory: 'Սնունդ / Еда',
      score: 0,
      revealedLetters: [],
      correctAnswersCount: 0,
      totalQuestionsAnswered: 0,
      spinsCount: 0,
      isCompleted: false,
      usedQuestionIds: []
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FF4E50] via-[#F43F5E] to-[#E11D48] text-slate-100 flex flex-col font-sans selection:bg-[#F9D423] selection:text-slate-950">
      {/* Top Navigation / Status Bar */}
      <header className="sticky top-0 z-40 bg-black/30 backdrop-blur-md border-b border-white/20 px-4 py-3 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Logo and Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F9D423] flex items-center justify-center shadow-lg shadow-black/20 border-2 border-white">
              <Trophy className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                <span>ПОЛЕ ЧУДЕС</span>
                <span className="text-slate-950 bg-[#F9D423] font-black text-xs px-2.5 py-0.5 rounded-full border border-white shadow-sm">
                  Հրաշքների դաշտ
                </span>
              </h1>
              <p className="text-[11px] sm:text-xs text-white/80 font-medium">
                Իսպաներենի քերականություն (HABLAR, COMER, VIVIR, SER, ESTAR)
              </p>
            </div>
          </div>

          {/* Right Action buttons: Audio Mute, Questions Bank */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Question Bank Button */}
            <button
              id="open-question-bank-btn"
              onClick={() => {
                soundManager.playClick();
                setIsReviewOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-black/35 hover:bg-black/50 border-2 border-white/30 text-white text-xs sm:text-sm font-bold transition-all shadow cursor-pointer active:scale-95"
              title="Դիտել բոլոր 54 հարցերը և թարգմանությունները"
            >
              <BookOpen className="w-4 h-4 text-[#F9D423]" />
              <span className="hidden sm:inline">54 հարցերի շտեմարան</span>
              <span className="sm:hidden">Հարցեր</span>
            </button>

            {/* Global Audio Toggle (Mute/Unmute) */}
            <button
              id="global-audio-toggle-btn"
              onClick={toggleMute}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black border-2 transition-all cursor-pointer shadow active:scale-95 ${
                isMuted
                  ? 'bg-black/50 border-rose-400 text-rose-300 hover:bg-black/60'
                  : 'bg-black/35 border-white/40 text-emerald-300 hover:bg-black/50'
              }`}
              title={isMuted ? 'Միացնել ձայնը (Unmute)' : 'Անջատել ձայնը (Mute)'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              <span className="hidden sm:inline">{isMuted ? 'Ձայնն անջատված է' : 'Ձայնը միացված է'}</span>
            </button>

            {/* Restart Game */}
            <button
              id="restart-game-btn"
              onClick={handleRestartGame}
              className="p-2.5 rounded-xl bg-black/35 hover:bg-black/50 border-2 border-white/30 text-white transition-colors cursor-pointer active:scale-95 shadow"
              title="Վերսկսել խաղը"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Players Progress Bar Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/15 px-4 py-3">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Player 1 Card */}
          <div
            className={`p-3.5 rounded-2xl border-2 transition-all flex items-center justify-between shadow-md ${
              activePlayerId === 1 && phase === 'player1_play'
                ? 'bg-white text-slate-950 border-[#F9D423] ring-4 ring-[#F9D423]/50 shadow-xl'
                : player1.isCompleted
                ? 'bg-black/40 text-white border-emerald-400/60'
                : 'bg-black/30 text-white/80 border-white/20 opacity-75'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-base shadow-sm border-2 ${
                  activePlayerId === 1 && phase === 'player1_play'
                    ? 'bg-[#FF4E50] text-white border-white'
                    : 'bg-black/40 text-white border-white/30'
                }`}
              >
                1
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`font-black text-sm ${activePlayerId === 1 && phase === 'player1_play' ? 'text-slate-950' : 'text-white'}`}>
                    Խաղացող 1
                  </span>
                  {activePlayerId === 1 && phase === 'player1_play' && (
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#FF4E50] text-white font-black animate-pulse">
                      Հերթը
                    </span>
                  )}
                  {player1.isCompleted && (
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-black">
                      Ավարտված ✓
                    </span>
                  )}
                </div>
                <div className={`text-xs font-semibold ${activePlayerId === 1 && phase === 'player1_play' ? 'text-slate-600' : 'text-white/80'}`}>
                  Հարցերի շարք՝ 1–27 • {player1.targetWord.length} տառանի բառ
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-xl font-black ${activePlayerId === 1 && phase === 'player1_play' ? 'text-[#FF4E50]' : 'text-[#F9D423]'}`}>
                {player1.score}
              </div>
              <div className={`text-[10px] uppercase font-bold tracking-wider ${activePlayerId === 1 && phase === 'player1_play' ? 'text-slate-500' : 'text-white/70'}`}>
                միավոր
              </div>
            </div>
          </div>

          {/* Player 2 Card */}
          <div
            className={`p-3.5 rounded-2xl border-2 transition-all flex items-center justify-between shadow-md ${
              activePlayerId === 2 && phase === 'player2_play'
                ? 'bg-white text-slate-950 border-[#F9D423] ring-4 ring-[#F9D423]/50 shadow-xl'
                : player2.isCompleted
                ? 'bg-black/40 text-white border-emerald-400/60'
                : 'bg-black/30 text-white/80 border-white/20 opacity-75'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-base shadow-sm border-2 ${
                  activePlayerId === 2 && phase === 'player2_play'
                    ? 'bg-[#FF4E50] text-white border-white'
                    : 'bg-black/40 text-white border-white/30'
                }`}
              >
                2
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`font-black text-sm ${activePlayerId === 2 && phase === 'player2_play' ? 'text-slate-950' : 'text-white'}`}>
                    Խաղացող 2
                  </span>
                  {activePlayerId === 2 && phase === 'player2_play' && (
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#FF4E50] text-white font-black animate-pulse">
                      Հերթը
                    </span>
                  )}
                  {player2.isCompleted && (
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-black">
                      Ավարտված ✓
                    </span>
                  )}
                </div>
                <div className={`text-xs font-semibold ${activePlayerId === 2 && phase === 'player2_play' ? 'text-slate-600' : 'text-white/80'}`}>
                  Հարցերի շարք՝ 28–54 • {player2.targetWord.length} տառանի բառ
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-xl font-black ${activePlayerId === 2 && phase === 'player2_play' ? 'text-[#FF4E50]' : 'text-[#F9D423]'}`}>
                {player2.score}
              </div>
              <div className={`text-[10px] uppercase font-bold tracking-wider ${activePlayerId === 2 && phase === 'player2_play' ? 'text-slate-500' : 'text-white/70'}`}>
                միավոր
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">
        {/* ROUND 1 COMPLETE SCREEN */}
        {phase === 'round1_complete' && (
          <div className="bg-slate-900 border-2 border-[#F9D423] rounded-3xl p-6 sm:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] text-center max-w-2xl mx-auto my-auto animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-[#F9D423] text-slate-950 flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(249,212,35,0.6)] border-2 border-white">
              <Trophy className="w-10 h-10" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">
              Խաղացող 1-ը հաջողությամբ գուշակեց բառը!
            </h2>
            <p className="text-[#F9D423] font-mono font-black text-xl mb-4">
              ENTRENADOR — Մարզիչ / Тренер
            </p>

            <div className="bg-slate-950/70 rounded-2xl p-4 border border-slate-800 grid grid-cols-3 gap-3 my-6">
              <div>
                <div className="text-2xl font-black text-[#F9D423]">{player1.score}</div>
                <div className="text-xs text-slate-400">Վաստակած միավոր</div>
              </div>
              <div>
                <div className="text-2xl font-black text-emerald-400">{player1.correctAnswersCount}</div>
                <div className="text-xs text-slate-400">Ճիշտ պատասխան</div>
              </div>
              <div>
                <div className="text-2xl font-black text-amber-400">{player1.spinsCount}</div>
                <div className="text-xs text-slate-400">Պտույտների քանակ</div>
              </div>
            </div>

            <p className="text-sm text-slate-300 mb-6">
              Այժմ խաղահարթակը տրամադրվում է <strong>Խաղացող 2-ին</strong> (Հարցերի շարք՝ 28–54):
            </p>

            <button
              id="start-player-2-btn"
              onClick={handleStartPlayer2}
              className="w-full py-4 px-8 rounded-2xl bg-gradient-to-r from-[#F9D423] via-[#FFD700] to-[#F9D423] hover:from-white hover:to-[#F9D423] text-slate-950 font-black text-lg shadow-xl shadow-black/30 flex items-center justify-center gap-2 transform active:scale-95 transition-all cursor-pointer border-2 border-white"
            >
              <span>Սկսել Խաղացող 2-ի փուլը / Ход 2-го игрока</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* GAME OVER (FINAL PODIUM) */}
        {phase === 'game_over' && (
          <div className="bg-slate-900 border-2 border-[#F9D423] rounded-3xl p-6 sm:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] text-center max-w-3xl mx-auto my-auto animate-in zoom-in-95 duration-300">
            <div className="w-24 h-24 mx-auto rounded-3xl bg-[#F9D423] text-slate-950 flex items-center justify-center mb-5 shadow-[0_0_40px_rgba(249,212,35,0.7)] border-2 border-white">
              <Award className="w-14 h-14" />
            </div>

            <h2 className="text-3xl sm:text-4xl font-black text-white mb-2">
              Խաղն ավարտվեց! / Игра окончена!
            </h2>
            <p className="text-slate-300 text-base mb-8">
              Երկու մասնակիցներն էլ հիանալի կատարեցին առաջադրանքները և գուշակեցին բառերը:
            </p>

            {/* Comparison Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {/* Player 1 summary */}
              <div
                className={`p-5 rounded-2xl border-2 text-left relative overflow-hidden ${
                  player1.score >= player2.score
                    ? 'bg-slate-800/90 border-[#F9D423] shadow-xl'
                    : 'bg-slate-950/60 border-slate-800'
                }`}
              >
                {player1.score >= player2.score && (
                  <span className="absolute top-3 right-3 text-xs bg-[#F9D423] text-slate-950 font-black px-2.5 py-1 rounded-full border border-white">
                    👑 Հաղթող
                  </span>
                )}
                <h3 className="font-black text-lg text-white mb-1">Խաղացող 1</h3>
                <div className="text-xs text-[#F9D423] font-bold mb-3">Բառ՝ ENTRENADOR (Մարզիչ)</div>
                <div className="space-y-1.5 text-sm text-slate-300">
                  <div className="flex justify-between">
                    <span>Միավորներ:</span>
                    <strong className="text-[#F9D423] text-lg font-black">{player1.score}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Ճիշտ պատասխաններ:</span>
                    <strong className="text-emerald-400 font-bold">{player1.correctAnswersCount}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Պտույտներ:</span>
                    <strong className="text-slate-200">{player1.spinsCount}</strong>
                  </div>
                </div>
              </div>

              {/* Player 2 summary */}
              <div
                className={`p-5 rounded-2xl border-2 text-left relative overflow-hidden ${
                  player2.score >= player1.score
                    ? 'bg-slate-800/90 border-[#F9D423] shadow-xl'
                    : 'bg-slate-950/60 border-slate-800'
                }`}
              >
                {player2.score >= player1.score && (
                  <span className="absolute top-3 right-3 text-xs bg-[#F9D423] text-slate-950 font-black px-2.5 py-1 rounded-full border border-white">
                    👑 Հաղթող
                  </span>
                )}
                <h3 className="font-black text-lg text-white mb-1">Խաղացող 2</h3>
                <div className="text-xs text-[#F9D423] font-bold mb-3">Բառ՝ VERDURAS (Բանջարեղեն)</div>
                <div className="space-y-1.5 text-sm text-slate-300">
                  <div className="flex justify-between">
                    <span>Միավորներ:</span>
                    <strong className="text-[#F9D423] text-lg font-black">{player2.score}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Ճիշտ պատասխաններ:</span>
                    <strong className="text-emerald-400 font-bold">{player2.correctAnswersCount}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Պտույտներ:</span>
                    <strong className="text-slate-200">{player2.spinsCount}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Restart Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                id="play-again-btn"
                onClick={handleRestartGame}
                className="py-3.5 px-8 rounded-2xl bg-[#F9D423] hover:bg-white text-slate-950 font-black text-base shadow-lg shadow-black/30 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 border-2 border-white"
              >
                <RotateCcw className="w-5 h-5" />
                <span>Խաղալ նորից / Играть снова</span>
              </button>

              <button
                id="review-all-questions-btn"
                onClick={() => {
                  soundManager.playClick();
                  setIsReviewOpen(true);
                }}
                className="py-3.5 px-8 rounded-2xl bg-black/40 hover:bg-black/60 border-2 border-white/30 text-white font-bold text-base flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <BookOpen className="w-5 h-5 text-[#F9D423]" />
                <span>Ուսումնասիրել բոլոր 54 հարցերը</span>
              </button>
            </div>
          </div>
        )}

        {/* ACTIVE PLAYING VIEW */}
        {(phase === 'player1_play' || phase === 'player2_play') && (
          <div className="flex flex-col gap-6">
            {/* Letter Board (Word Showcase) */}
            <LetterBoard
              targetWord={currentPlayer.targetWord}
              revealedLetters={currentPlayer.revealedLetters}
              isPlusSectorActive={turnStep === 'plus_letter'}
              onSelectLetterToReveal={handlePlusLetterReveal}
              categoryHint={currentPlayer.targetWordCategory}
              categoryHintArm={currentPlayer.targetWordArmMeaning}
            />

            {/* Status & Banner Message */}
            <div className="p-4 rounded-2xl bg-slate-900/90 backdrop-blur-md border-2 border-[#F9D423]/40 flex flex-wrap items-center justify-between gap-3 text-sm shadow-lg">
              <div className="flex items-center gap-2.5">
                <Zap className="w-5 h-5 text-[#F9D423] shrink-0" />
                <span className="font-bold text-white text-sm sm:text-base">{statusMessage}</span>
              </div>

              {/* Button to Guess Full Word */}
              <button
                id="guess-whole-word-trigger-btn"
                onClick={() => {
                  soundManager.playClick();
                  setIsGuessWordModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-[#F9D423] hover:bg-white text-slate-950 border-2 border-white text-xs sm:text-sm font-black whitespace-nowrap transition-all cursor-pointer shrink-0 shadow-md active:scale-95"
              >
                🌟 Ասել ամբողջ բառը
              </button>
            </div>

            {/* Middle Interactive Zone: Wheel + Question / Action Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Wheel Section (Left / Center) */}
              <div className="lg:col-span-5 flex flex-col items-center justify-center">
                <Wheel
                  onSpinComplete={handleSpinComplete}
                  isSpinning={isSpinning}
                  disabled={turnStep === 'question' || turnStep === 'plus_letter'}
                />
              </div>

              {/* Action / Question Panel (Right) */}
              <div className="lg:col-span-7 flex flex-col gap-4">
                {/* Active Question Card */}
                {turnStep === 'question' && currentQuestion && currentSector && (
                  <QuestionCard
                    question={currentQuestion}
                    pointsToWin={
                      currentSector.type === 'double'
                        ? Math.max(currentPlayer.score, 300)
                        : currentSector.value || 300
                    }
                    onAnswerSelected={handleQuestionAnswer}
                  />
                )}

                {/* Pick Letter from Keyboard Mode */}
                {(turnStep === 'pick_letter' || turnStep === 'spin') && (
                  <div className="bg-slate-900/90 backdrop-blur-md border-2 border-[#F9D423]/40 rounded-2xl p-5 shadow-xl">
                    <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-white">
                          {turnStep === 'pick_letter' ? '👉 Ընտրեք տառ ստեղնաշարից:' : 'Իսպաներեն այբուբենի տառեր:'}
                        </span>
                      </div>
                      <span className="text-xs text-slate-300 font-medium">
                        {turnStep === 'pick_letter'
                          ? 'Կտտացրեք տառին՝ այն ստուգելու համար'
                          : 'Նախ պտտեք բարաբանը'}
                      </span>
                    </div>

                    {/* Spanish Alphabet Keyboard */}
                    <div className="grid grid-cols-7 sm:grid-cols-9 gap-1.5 sm:gap-2">
                      {SPANISH_ALPHABET.map(char => {
                        const isRevealed = currentPlayer.revealedLetters.includes(char);
                        const isInTarget = currentPlayer.targetWord.toUpperCase().includes(char);
                        const isEnabled = turnStep === 'pick_letter' && !isRevealed;

                        let keyClass = 'bg-slate-800 text-slate-200 border-slate-700 hover:border-[#F9D423] hover:bg-slate-700';

                        if (isRevealed) {
                          if (isInTarget) {
                            keyClass = 'bg-[#F9D423]/25 border-[#F9D423] text-[#F9D423] font-black opacity-80 cursor-not-allowed';
                          } else {
                            keyClass = 'bg-slate-950/70 border-slate-800 text-slate-600 line-through opacity-40 cursor-not-allowed';
                          }
                        } else if (turnStep === 'pick_letter') {
                          keyClass = 'bg-gradient-to-b from-[#F9D423] via-[#FFD700] to-[#F59E0B] text-slate-950 border-2 border-white shadow-lg transform hover:scale-110 cursor-pointer animate-pulse font-black';
                        } else {
                          keyClass = 'bg-slate-800/40 text-slate-500 border-slate-800 opacity-50 cursor-not-allowed';
                        }

                        return (
                          <button
                            key={char}
                            id={`kbd-letter-${char}`}
                            disabled={!isEnabled}
                            onClick={() => handlePickLetter(char)}
                            className={`h-11 sm:h-12 rounded-xl border font-black text-base flex items-center justify-center transition-all ${keyClass}`}
                          >
                            {char}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Helpful Instruction Tip */}
                <div className="bg-slate-900/80 backdrop-blur-sm border-2 border-white/10 rounded-2xl p-4 text-xs text-slate-300 flex items-start gap-2.5 shadow-md">
                  <HelpCircle className="w-5 h-5 text-[#F9D423] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">Ինչպե՞ս խաղալ: </strong>
                    Պտտեք բարաբանը, ճիշտ պատասխանեք իսպաներենի հարցին (հայերեն թարգմանությունը բացվում է հարցին կտտացնելով), վաստակեք միավորներ և բացեք թաքնված բառի բոլոր տառերը:
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* GUESS FULL WORD MODAL */}
      {isGuessWordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border-2 border-[#F9D423] rounded-3xl max-w-md w-full p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            <h3 className="text-xl font-black text-white mb-1 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#F9D423]" />
              <span>Ասել ամբողջ բառը</span>
            </h3>
            <p className="text-xs text-slate-300 mb-4">
              Մուտքագրեք իսպաներեն թաքնված բառը: Ճիշտ գուշակելու դեպքում կստանաք <strong className="text-[#F9D423]">+1500 բոնուս միավոր</strong>:
            </p>

            <form onSubmit={handleGuessFullWord} className="flex flex-col gap-3">
              <input
                type="text"
                value={fullWordInput}
                onChange={e => setFullWordInput(e.target.value)}
                placeholder="Մուտքագրեք թաքնված բառը..."
                className="w-full px-4 py-3 bg-slate-800 border-2 border-slate-700 focus:border-[#F9D423] rounded-2xl text-lg font-mono font-black text-white uppercase placeholder-slate-400 focus:outline-none"
                autoFocus
              />

              {guessErrorMsg && (
                <div className="p-3 rounded-xl bg-rose-950/70 border-2 border-rose-500 text-rose-200 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{guessErrorMsg}</span>
                </div>
              )}

              <div className="flex items-center gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    soundManager.playClick();
                    setIsGuessWordModalOpen(false);
                    setGuessErrorMsg(null);
                  }}
                  className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition-colors cursor-pointer border border-slate-700"
                >
                  Չեղարկել
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 rounded-xl bg-[#F9D423] hover:bg-white text-slate-950 font-black text-sm transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-lg border-2 border-white active:scale-95"
                >
                  <Send className="w-4 h-4" />
                  <span>Հաստատել</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 54 QUESTIONS REVIEW & DICTIONARY MODAL */}
      <QuestionsReviewModal
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
      />
    </div>
  );
}
