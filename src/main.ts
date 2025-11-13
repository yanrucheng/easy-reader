import { initializePronunciationMap } from './utils/pronunciationMap';
import { transformPlain, transformHTML } from './utils/transformer';
import { handleCopy } from './utils/copyUtils';
import { initializeHoverMenu } from './utils/hoverMenu';
import './styles.css';
import characterFrequencyDataRaw from '../character-frequency.json';

let currentTopK = 2500;
let allowDifferentTones = true; // Default to true (music mode enabled)
let highlightMultiPronunciation = false; // Default to false as per user request
const allowedCharacters = new Set<string>();

function updateAllowedCharacters(topK: number): void {
  allowedCharacters.clear();
  const characterFrequencyData: string[] = (characterFrequencyDataRaw as (string | null)[]).filter(
    (char): char is string => char !== null && char !== undefined && char !== ''
  );
  const topCharacters = characterFrequencyData.slice(0, topK);
  topCharacters.forEach(char => allowedCharacters.add(char));
}

function updateOutput(): void {
  const inputElement = document.getElementById('input') as HTMLTextAreaElement | null;
  const outputContentElement = document.getElementById('outputContent') as HTMLDivElement | null;

  if (!inputElement || !outputContentElement) {
    console.error('Required elements not found');
    return;
  }

  outputContentElement.innerHTML = transformHTML(
    inputElement.value,
    allowedCharacters,
    allowDifferentTones,
    highlightMultiPronunciation
  );
}

// Output copy handler
function handleOutputCopy(): void {
  const inputElement = document.getElementById('input') as HTMLTextAreaElement | null;
  if (!inputElement) return;

  handleCopy('copyBtn', () => transformPlain(
    inputElement.value,
    allowedCharacters,
    allowDifferentTones
  ));
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

function handleMultiPronunciationSwitchChange(event: Event): void {
  const switchElement = event.target as HTMLInputElement;

  if (!switchElement) {
    console.error('Switch element not found');
    return;
  }

  highlightMultiPronunciation = switchElement.checked;
  updateOutput();
}

function initializeApp(): void {
  const inputElement = document.getElementById('input');
  const outputElement = document.getElementById('output');
  const copyButton = document.getElementById('copyBtn');
  const topKSlider = document.getElementById('topKSlider');
  const toneSwitch = document.getElementById('toneSwitch');
  const multiPronunciationSwitch = document.getElementById('highlightMultiPronunciation');

  if (!inputElement || !outputElement || !copyButton || !topKSlider || !toneSwitch || !multiPronunciationSwitch) {
    console.error('Required elements not found');
    return;
  }

  // Initialize pronunciation map and allowed characters
  initializePronunciationMap();
  updateAllowedCharacters(currentTopK);

  // Initialize switch state
  highlightMultiPronunciation = (multiPronunciationSwitch as HTMLInputElement).checked;

  inputElement.addEventListener('input', updateOutput);
  outputElement.addEventListener('paste', handlePaste);
  copyButton.addEventListener('click', handleOutputCopy);
  topKSlider.addEventListener('input', handleTopKChange);
  (toneSwitch as HTMLInputElement).addEventListener('change', handleToneSwitchChange);
  (multiPronunciationSwitch as HTMLInputElement).addEventListener('change', handleMultiPronunciationSwitchChange);

  // Add input copy button listener
  const inputCopyButton = document.getElementById('inputCopyBtn');
  if (inputCopyButton) {
    inputCopyButton.addEventListener('click', handleInputCopy);
  }

  updateOutput();
}

document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
  initializeHoverMenu();
});