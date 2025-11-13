import pinyin from 'pinyin';

/**
 * Gets pinyin without tone marks for a given character.
 */
export function getPinyinWithoutTone(char: string): string {
  const result = pinyin(char, {
    style: pinyin.STYLE_NORMAL, // This gives pinyin without tone marks
    heteronym: false
  });
  return result[0]?.[0] || char;
}

/**
 * Gets all pronunciations for a given character.
 */
export function getAllPronunciations(char: string): string[] {
  const result = pinyin(char, {
    style: pinyin.STYLE_TONE2, // We need tone2 style to be consistent with the rest of the code
    heteronym: true
  });

  const pronunciations = result[0] || [];

  // Filter out duplicates
  return [...new Set(pronunciations)];
}

/**
 * Gets pinyin with tone numbers for a given character.
 */
export function getPinyinWithTone(char: string): string {
  const result = pinyin(char, {
    style: pinyin.STYLE_TONE2, // This gives us tone numbers like su4
    heteronym: false
  });
  return result[0]?.[0] || char;
}

/**
 * Checks if a character has multiple pronunciations.
 */
export function hasMultiplePronunciations(char: string, allowDifferentTones: boolean): boolean {
  const pronunciations = getAllPronunciations(char);

  if (!allowDifferentTones) {
    // Default behavior - check if there are multiple pronunciations including tone differences
    return pronunciations.length > 1;
  } else {
    // Music mode - ignore tone differences when checking for multiple pronunciations
    if (pronunciations.length <= 1) {
      return false;
    }

    // Convert all pronunciations to the same style without tones and check if they are unique
    const uniquePronunciationsWithoutTone = new Set<string>();

    for (const pronunciation of pronunciations) {
      // Extract the base pronunciation without tone (remove the last character which is the tone number)
      const baseWithoutTone = pronunciation.replace(/\d$/, '');
      uniquePronunciationsWithoutTone.add(baseWithoutTone);
    }

    // If there's more than one unique base pronunciation without tone, it's truly a multi-pronunciation character
    return uniquePronunciationsWithoutTone.size > 1;
  }
}