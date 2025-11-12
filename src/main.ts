import pinyin from 'pinyin';
import characterFrequencyDataRaw from '../character-frequency.json';
const characterFrequencyData: string[] = (characterFrequencyDataRaw as (string | null)[]).filter(
  (char): char is string => char !== null && char !== undefined && char !== ''
);

interface ReplacementConfig {
  pattern: RegExp;
  value: string;
  isOutsideTopK: boolean;
  isDifferentTone: boolean; // Indicates if replacement uses a different tone
}

function getPinyinWithoutTone(char: string): string {
  const result = pinyin(char, {
    style: pinyin.STYLE_NORMAL, // This gives pinyin without tone marks
    heteronym: false
  });
  return result[0]?.[0] || char;
}

let currentTopK = 2500;
let allowDifferentTones = true; // Default to true as per user request
const allowedCharacters = new Set<string>();
let pronunciationMap: Map<string, string[]> = new Map(); // Maps pinyin to array of characters sorted by frequency

function initializePronunciationMap(): void {
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

function updateAllowedCharacters(topK: number): void {
  allowedCharacters.clear();
  const topCharacters = characterFrequencyData.slice(0, topK);
  topCharacters.forEach(char => allowedCharacters.add(char));
}

function getPinyinWithTone(char: string): string {
  const result = pinyin(char, {
    style: pinyin.STYLE_TONE2, // This gives us tone numbers like su4
    heteronym: false
  });
  return result[0]?.[0] || char;
}

function getSamePronunciationReplacement(char: string): { value: string; isOutsideTopK: boolean; isDifferentTone: boolean } {
  const charPinyin = getPinyinWithTone(char);
  const samePronunciationChars = pronunciationMap.get(charPinyin);

  // Try to find same tone replacement first
  if (samePronunciationChars) {
    const replacementChar = samePronunciationChars.find(c => allowedCharacters.has(c) && c !== char);
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
        const replacementChar = chars.find(c => allowedCharacters.has(c) && c !== char);
        if (replacementChar) {
          return { value: replacementChar, isOutsideTopK: false, isDifferentTone: true };
        }
      }
    }
  }

  // If no replacement found in allowed characters, check same tone outside top-K
  if (samePronunciationChars) {
    const mostFrequentChar = samePronunciationChars[0];
    if (mostFrequentChar && mostFrequentChar !== char) {
      return { value: mostFrequentChar, isOutsideTopK: true, isDifferentTone: false };
    }
  }

  // Original is already the most frequent or no other options
  return { value: char, isOutsideTopK: true, isDifferentTone: false };
}

function createPinyinReplacements(text: string): ReplacementConfig[] {
  const chineseCharRegex = /[\u4e00-\u9fff]/g;
  const matches = text.match(chineseCharRegex) || [];
  const uniqueChars = [...new Set(matches)];

  return uniqueChars
    .filter(char => !allowedCharacters.has(char))
    .map(char => {
      const { value, isOutsideTopK, isDifferentTone } = getSamePronunciationReplacement(char);
      return {
        pattern: new RegExp(char, 'g'),
        value,
        isOutsideTopK,
        isDifferentTone
      };
    });
}

function escapeHtml(text: string): string {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };
  
  return text.replace(/[&<>"']/g, (match: string): string => htmlEntities[match] ?? match);
}

function transformPlain(text: string): string {
  const replacements = createPinyinReplacements(text);
  return replacements.reduce((result, { pattern, value }) =>
    result.replace(pattern, value), text
  );
}

function transformHTML(text: string): string {
  const escapedText = escapeHtml(text);
  // Preserve line breaks by converting them to <br> tags
  const textWithLineBreaks = escapedText.replace(/\n/g, "<br>");
  const replacements = createPinyinReplacements(text);
  return replacements.reduce((result, { pattern, value, isOutsideTopK, isDifferentTone }) => {
    let className = isOutsideTopK ? "hl-red" : "hl";
    if (!isOutsideTopK && isDifferentTone) {
      className = "hl-purple"; // Different tone replacements are purple
    }
    return result.replace(pattern, `<mark class="${className}">${value}</mark>`);
  }, textWithLineBreaks);
}

function updateOutput(): void {
  const inputElement = document.getElementById('input') as HTMLTextAreaElement | null;
  const outputContentElement = document.getElementById('outputContent') as HTMLDivElement | null;

  if (!inputElement || !outputContentElement) {
    console.error('Required elements not found');
    return;
  }

  outputContentElement.innerHTML = transformHTML(inputElement.value);
}

function handleCopy(buttonId: string, getTextToCopy: () => string): void {
  const copyButton = document.getElementById(buttonId) as HTMLButtonElement | null;

  if (!copyButton) {
    console.error('Copy button not found');
    return;
  }

  const textToCopy = getTextToCopy();

  navigator.clipboard.writeText(textToCopy)
    .then(() => {
      const originalText = copyButton.textContent;
      copyButton.textContent = '已复制';
      setTimeout(() => {
        copyButton.textContent = originalText;
      }, 1500);
    })
    .catch(() => {
      console.error('Clipboard copy failed');
    });
}

// Output copy handler
function handleOutputCopy(): void {
  const inputElement = document.getElementById('input') as HTMLTextAreaElement | null;
  if (!inputElement) return;

  handleCopy('copyBtn', () => transformPlain(inputElement.value));
}

// Input copy handler
function handleInputCopy(): void {
  const inputElement = document.getElementById('input') as HTMLTextAreaElement | null;
  if (!inputElement) return;

  handleCopy('inputCopyBtn', () => inputElement.value);
}

function handlePaste(event: ClipboardEvent): void {
  event.preventDefault();
}

function handleTopKChange(event: Event): void {
  const slider = event.target as HTMLInputElement;
  const topKValue = document.getElementById('topKValue');

  if (!slider || !topKValue) {
    console.error('Slider or value element not found');
    return;
  }

  currentTopK = parseInt(slider.value);
  topKValue.textContent = currentTopK.toString();
  updateAllowedCharacters(currentTopK);
  updateOutput();
}

function handleToneSwitchChange(event: Event): void {
  const switchElement = event.target as HTMLInputElement;

  if (!switchElement) {
    console.error('Switch element not found');
    return;
  }

  allowDifferentTones = switchElement.checked;
  updateOutput();
}

function initializeApp(): void {
  const inputElement = document.getElementById('input');
  const outputElement = document.getElementById('output');
  const copyButton = document.getElementById('copyBtn');
  const topKSlider = document.getElementById('topKSlider');
  const toneSwitch = document.getElementById('toneSwitch');

  if (!inputElement || !outputElement || !copyButton || !topKSlider || !toneSwitch) {
    console.error('Required elements not found');
    return;
  }

  // Initialize pronunciation map and allowed characters
  initializePronunciationMap();
  updateAllowedCharacters(currentTopK);

  inputElement.addEventListener('input', updateOutput);
  outputElement.addEventListener('paste', handlePaste);
  copyButton.addEventListener('click', handleOutputCopy);
  topKSlider.addEventListener('input', handleTopKChange);
  (toneSwitch as HTMLInputElement).addEventListener('change', handleToneSwitchChange);

  // Add input copy button listener
  const inputCopyButton = document.getElementById('inputCopyBtn');
  if (inputCopyButton) {
    inputCopyButton.addEventListener('click', handleInputCopy);
  }

  updateOutput();
}

document.addEventListener('DOMContentLoaded', initializeApp);