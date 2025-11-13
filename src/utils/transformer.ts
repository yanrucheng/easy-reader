import { createPinyinReplacements, escapeHtml } from './replacementEngine';
import { hasMultiplePronunciations, getAllPronunciations } from './pinyin';
import { getAlternativeCharactersByPronunciation, getCharacterFrequencyIndex } from './pronunciationMap';

export function transformPlain(
  text: string,
  allowedCharacters: Set<string>,
  allowDifferentTones: boolean
): string {
  const replacements = createPinyinReplacements(text, allowedCharacters, allowDifferentTones);
  return replacements.reduce((result, { pattern, value }) =>
    result.replace(pattern, value), text
  );
}

export function transformHTML(
  text: string,
  allowedCharacters: Set<string>,
  allowDifferentTones: boolean,
  highlightMultiPronunciation: boolean
): string {
  const escapedText = escapeHtml(text);
  // Preserve line breaks by converting them to <br> tags
  const textWithLineBreaks = escapedText.replace(/\n/g, "<br>");

  // Get all replacements first
  const replacements = createPinyinReplacements(text, allowedCharacters, allowDifferentTones);
  const replacementMap = new Map<string, { value: string; className: string }>();

  // Build replacement map
  replacements.forEach(({ pattern, value, isOutsideTopK, isDifferentTone }) => {
    let className = isOutsideTopK ? "hl-red" : "hl";
    if (!isOutsideTopK && isDifferentTone) {
      className = "hl-purple"; // Different tone replacements are purple
    }
    // Extract the character from the regex pattern
    const char = pattern.source;
    replacementMap.set(char, { value, className });
  });

  // Now process each character individually to handle multi-pronunciation highlighting
  let result = "";
  let i = 0;

  while (i < textWithLineBreaks.length) {
    // Check if current character is a line break tag
    if (textWithLineBreaks.substr(i, 4) === "<br>") {
      result += "<br>";
      i += 4;
      continue;
    }

    const char = textWithLineBreaks[i] as string;

    // Check if it's a Chinese character
    if (/[\u4e00-\u9fff]/.test(char)) {
      // Check if we need to replace it
      if (replacementMap.has(char)) {
        // Use replacement with appropriate highlight
        const { value, className } = replacementMap.get(char)!;
        result += `<mark class="${className}">${value}</mark>`;
      } else {
        // Check if it has multiple pronunciations and we should highlight it
        if (highlightMultiPronunciation && hasMultiplePronunciations(char, allowDifferentTones)) {
          // Check if character is in top 300 most frequent
          const charIndex = getCharacterFrequencyIndex(char);
          const isTop300 = charIndex >= 0 && charIndex < 300;

          // Mark as light green if top 300, otherwise regular green
          const highlightClass = isTop300 ? "hl-lightgreen" : "hl-green";

          // Get all pronunciations for this character
          const pronunciations = getAllPronunciations(char);

          // Create a data attribute with all pronunciations and their alternatives
          const pronunciationsData = pronunciations.map(pronunciation => {
            const { sameTone, differentTone } = getAlternativeCharactersByPronunciation(pronunciation, char);
            return `${pronunciation}:${sameTone.join(',')}:${differentTone.join(',')}`;
          }).join('|');

          // Add data attributes for hover menu
          result += `<mark class="${highlightClass} pronunciation-menu-trigger" data-multipronounce="${pronunciationsData}" data-char="${char}">${char}</mark>`;
        } else {
          // Keep as is
          result += char;
        }
      }
    } else {
      // Non-Chinese character, keep as is
      result += char;
    }

    i++;
  }

  return result;
}