export interface ReplacementConfig {
  pattern: RegExp;
  value: string;
  isOutsideTopK: boolean;
  isDifferentTone: boolean; // Indicates if replacement uses a different tone
}

export interface PronunciationReplacement {
  pronunciation: string;
  sameTone: string[];
  differentTone: string[];
}

export interface CharacterReplacement {
  value: string;
  isOutsideTopK: boolean;
  isDifferentTone: boolean;
}