import characterFrequencyDataRaw from '../../character-frequency.json';
import { getPinyinWithTone, getPinyinWithoutTone } from './pinyin';

const characterFrequencyData: string[] = (characterFrequencyDataRaw as (string | null)[]).filter(
  (char): char is string => char !== null && char !== undefined && char !== ''
);

let pronunciationMap: Map<string, string[]> = new Map(); // Maps pinyin to array of characters sorted by frequency

/**
 * Initializes the pronunciation map from character frequency data.
 */
export function initializePronunciationMap(): void {
  // Clear the map
  pronunciationMap.clear();

  // Build pronunciation map from character frequency data
  characterFrequencyData.forEach(char => {
    const pinyinValue = getPinyinWithTone(char);
    if (pinyinValue) { // Ensure we have a valid pinyin
      if (!pronunciationMap.has(pinyinValue)) {
        pronunciationMap.set(pinyinValue, []);
      }
      pronunciationMap.get(pinyinValue)?.push(char);
    }
  });
}

/**
 * Gets characters with the exact same pronunciation (including tone).
 */
export function getAlternativeCharactersForPronunciation(
  pronunciation: string,
  excludeChar: string,
  maxResults: number = 2
): string[] {
  // Get all characters with the exact same pronunciation (including tone)
  const sameToneChars = pronunciationMap.get(pronunciation) || [];

  return sameToneChars.filter(char =>
    char !== excludeChar
  ).slice(0, maxResults);
}

/**
 * Gets alternative characters with the same base pronunciation (ignoring tone).
 */
export function getAlternativeCharactersForPronunciationWithoutTone(
  basePronunciation: string,
  excludeChar: string,
  maxResults: number = 2
): string[] {
  const alternatives: string[] = [];

  // Search all characters with the same base pronunciation (ignoring tone)
  for (const [, chars] of pronunciationMap.entries()) {
    const firstChar = chars[0];
    if (!firstChar) continue;

    const mapBasePronunciation = getPinyinWithoutTone(firstChar);
    if (mapBasePronunciation === basePronunciation) {
      // Find the first suitable character for this tone variation
      const alternative = chars.find(char =>
        char !== excludeChar
      );

      if (alternative && !alternatives.includes(alternative)) {
        alternatives.push(alternative);
        if (alternatives.length >= maxResults) {
          break;
        }
      }
    }
  }

  return alternatives;
}

/**
 * Gets all characters with alternative pronunciations.
 */
export function getAlternativeCharactersByPronunciation(
  pronunciation: string,
  excludeChar: string
): { sameTone: string[]; differentTone: string[] } {
  const basePronunciation = pronunciation.replace(/\d$/, '');

  // Get alternatives with the exact same tone
  const sameTone = getAlternativeCharactersForPronunciation(pronunciation, excludeChar);

  // Get alternatives with different tones (same base pronunciation)
  const differentTone = getAlternativeCharactersForPronunciationWithoutTone(basePronunciation, excludeChar);

  return { sameTone, differentTone };
}

/**
 * Gets character frequency index.
 */
export function getCharacterFrequencyIndex(char: string): number {
  return characterFrequencyData.indexOf(char);
}

/**
 * Gets pronunciation map.
 */
export function getPronunciationMap(): Map<string, string[]> {
  return pronunciationMap;
}