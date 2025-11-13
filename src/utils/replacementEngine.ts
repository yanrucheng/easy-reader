import { ReplacementConfig, CharacterReplacement } from '../types';
import { hasMultiplePronunciations, getPinyinWithoutTone, getPinyinWithTone } from './pinyin';
import { getPronunciationMap } from './pronunciationMap';

export function createPinyinReplacements(
  text: string,
  allowedCharacters: Set<string>,
  allowDifferentTones: boolean
): ReplacementConfig[] {
  const chineseCharRegex = /[\u4e00-\u9fff]/g;
  const matches = text.match(chineseCharRegex) || [];
  const uniqueChars = [...new Set(matches)];

  return uniqueChars
    .filter(char => !allowedCharacters.has(char))
    .map(char => {
      const { value, isOutsideTopK, isDifferentTone } = getSamePronunciationReplacement(
        char,
        allowedCharacters,
        allowDifferentTones
      );
      return {
        pattern: new RegExp(char, 'g'),
        value,
        isOutsideTopK,
        isDifferentTone
      };
    });
}

export function getSamePronunciationReplacement(
  char: string,
  allowedCharacters: Set<string>,
  allowDifferentTones: boolean
): CharacterReplacement {
  const charPinyin = getPinyinWithTone(char);
  const pronunciationMap = getPronunciationMap();
  const samePronunciationChars = pronunciationMap.get(charPinyin);

  // Try to find same tone replacement first
  if (samePronunciationChars) {
    const replacementChar = samePronunciationChars.find(c =>
      allowedCharacters.has(c) &&
      c !== char &&
      !hasMultiplePronunciations(c, allowDifferentTones) // Avoid ambiguous characters
    );
    if (replacementChar) {
      return { value: replacementChar, isOutsideTopK: false, isDifferentTone: false };
    }
  }

  // If same tone replacement not found and different tones are allowed
  if (allowDifferentTones) {
    const charPinyinWithoutTone = getPinyinWithoutTone(char);

    // Search all characters with the same pronunciation (ignoring tone)
    for (const [pinyinWithTone, chars] of pronunciationMap.entries()) {
      // Get first character and ensure it's valid before getting pinyin without tone
      const firstChar = chars[0];
      if (!firstChar) continue;
      const mapPinyinWithoutTone = getPinyinWithoutTone(firstChar); // All chars in the map entry have same pinyin

      if (mapPinyinWithoutTone === charPinyinWithoutTone && pinyinWithTone !== charPinyin) {
        const replacementChar = chars.find(c =>
          allowedCharacters.has(c) &&
          c !== char &&
          !hasMultiplePronunciations(c, allowDifferentTones) // Avoid ambiguous characters
        );
        if (replacementChar) {
          return { value: replacementChar, isOutsideTopK: false, isDifferentTone: true };
        }
      }
    }
  }

  // If no replacement found in allowed characters, check same tone outside top-K
  if (samePronunciationChars) {
    // Find the most frequent character that is not the original and not ambiguous
    const mostFrequentChar = samePronunciationChars.find(c =>
      c !== char &&
      !hasMultiplePronunciations(c, allowDifferentTones) // Avoid ambiguous characters
    );
    if (mostFrequentChar) {
      return { value: mostFrequentChar, isOutsideTopK: true, isDifferentTone: false };
    }
  }

  // Original is already the most frequent or no other options
  return { value: char, isOutsideTopK: true, isDifferentTone: false };
}

export function escapeHtml(text: string): string {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };

  return text.replace(/[&<>"']/g, (match: string): string => htmlEntities[match] ?? match);
}