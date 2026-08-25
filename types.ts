export interface Question {
  id: number;
  category: string;
  categoryArm: string;
  verb: string;
  spanish: string;
  armenian: string;
  options: string[];
  correctAnswer: string; // "a" | "b" | "c" | "d"
}

export type SectorType = 'points' | 'plus' | 'double' | 'chance' | 'bonus';

export interface WheelSector {
  id: number;
  label: string;
  type: SectorType;
  value: number; // point value or multiplier
  color: string;
  textColor: string;
}

export interface PlayerStats {
  id: 1 | 2;
  name: string;
  nameArm: string;
  targetWord: string;
  targetWordArmMeaning: string;
  targetWordCategory: string;
  score: number;
  revealedLetters: string[];
  correctAnswersCount: number;
  totalQuestionsAnswered: number;
  spinsCount: number;
  isCompleted: boolean;
  usedQuestionIds: number[];
}

export type GamePhase = 
  | 'player1_intro'
  | 'player1_play'
  | 'round1_complete'
  | 'player2_intro'
  | 'player2_play'
  | 'game_over';
