import characterFrequencyDataRaw from '../../character-frequency.json';
import { getPinyinWithTone, getPinyinWithoutTone, hasMultiplePronunciations } from './pinyin';

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
  maxResults: number = 2
): string[] {
  // Get all characters with the exact same pronunciation (including tone)
  const sameToneChars = pronunciationMap.get(pronunciation) || [];

  // Filter for single-pronunciation characters
  return sameToneChars.filter(char =>
    !hasMultiplePronunciations(char, false)
  ).slice(0, maxResults);
}

/**
 * Gets alternative characters with the same base pronunciation (ignoring tone).
 */
export function getAlternativeCharactersForPronunciationWithoutTone(
  basePronunciation: string,
  excludeChar: string,
  originalPronunciation: string, // Added parameter to exclude exact same pronunciation
  maxResults: number = 2
): string[] {
  const alternatives: string[] = [];

  // Search all characters with the same base pronunciation (ignoring tone)
  for (const [pronunciationKey, chars] of pronunciationMap.entries()) {
    const firstChar = chars[0];
    if (!firstChar) continue;

    // Skip the exact same pronunciation (including tone)
    if (pronunciationKey === originalPronunciation) {
      continue;
    }

    const mapBasePronunciation = getPinyinWithoutTone(firstChar);
    if (mapBasePronunciation === basePronunciation) {
      // Find the first suitable character for this tone variation
      const alternative = chars.find(char =>
        char !== excludeChar && !hasMultiplePronunciations(char, false)
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

  // Get same tone candidates - now returning max 1
  const sameTone = getAlternativeCharactersForPronunciation(pronunciation, 1);

  // Get ignoring tone candidates - return max 1, excluding same candidates
  let differentTone = getAlternativeCharactersForPronunciationWithoutTone(basePronunciation, excludeChar, pronunciation, 10);

  // Filter out any candidates that are already in sameTone
  differentTone = differentTone.filter(candidate => !sameTone.includes(candidate));

  // Take only the first one
  differentTone = differentTone.slice(0, 1);

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