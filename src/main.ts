import pinyin from 'pinyin';

interface ReplacementConfig {
  pattern: RegExp;
  value: string;
}

function getPinyinWithTone(char: string): string {
  const result = pinyin(char, {
    style: pinyin.STYLE_TONE2, // This gives us tone numbers like su4
    heteronym: false
  });
  return result[0]?.[0] || char;
}

function createPinyinReplacements(text: string): ReplacementConfig[] {
  const chineseCharRegex = /[\u4e00-\u9fff]/g;
  const matches = text.match(chineseCharRegex) || [];
  const uniqueChars = [...new Set(matches)];
  
  return uniqueChars.map(char => ({
    pattern: new RegExp(char, 'g'),
    value: getPinyinWithTone(char)
  }));
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
  const replacements = createPinyinReplacements(text);
  return replacements.reduce((result, { pattern, value }) => 
    result.replace(pattern, `<mark class="hl">${value}</mark>`), escapedText
  );
}

function updateOutput(): void {
  const inputElement = document.getElementById('input') as HTMLTextAreaElement | null;
  const outputElement = document.getElementById('output') as HTMLDivElement | null;
  
  if (!inputElement || !outputElement) {
    console.error('Required elements not found');
    return;
  }
  
  outputElement.innerHTML = transformHTML(inputElement.value);
}

function handleCopy(): void {
  const inputElement = document.getElementById('input') as HTMLTextAreaElement | null;
  const copyButton = document.getElementById('copyBtn') as HTMLButtonElement | null;
  
  if (!inputElement || !copyButton) {
    console.error('Required elements not found');
    return;
  }
  
  const textToCopy = transformPlain(inputElement.value);
  
  navigator.clipboard.writeText(textToCopy)
    .then(() => {
      const originalText = copyButton.textContent;
      copyButton.textContent = '已复制';
      setTimeout(() => {
        copyButton.textContent = originalText;
      }, 1500);
    })
    .catch(() => {
      const selection = window.getSelection();
      const range = document.createRange();
      const outputElement = document.getElementById('output');
      
      if (outputElement && selection) {
        range.selectNodeContents(outputElement);
        selection.removeAllRanges();
        selection.addRange(range);
        document.execCommand('copy');
        selection.removeAllRanges();
      }
    });
}

function handlePaste(event: ClipboardEvent): void {
  event.preventDefault();
}

function initializeApp(): void {
  const inputElement = document.getElementById('input');
  const outputElement = document.getElementById('output');
  const copyButton = document.getElementById('copyBtn');
  
  if (!inputElement || !outputElement || !copyButton) {
    console.error('Required elements not found');
    return;
  }
  
  inputElement.addEventListener('input', updateOutput);
  outputElement.addEventListener('paste', handlePaste);
  copyButton.addEventListener('click', handleCopy);
  
  updateOutput();
}

document.addEventListener('DOMContentLoaded', initializeApp);