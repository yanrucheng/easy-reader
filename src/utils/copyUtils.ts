export function handleCopy(buttonId: string, getTextToCopy: () => string): void {
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