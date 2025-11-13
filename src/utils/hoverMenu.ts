export function initializeHoverMenu(): void {
  const outputContent = document.getElementById('outputContent');

  // Create the menu element
  const menu = document.createElement('div');
  menu.className = 'pronunciation-menu';
  menu.style.display = 'none';
  document.body.appendChild(menu);

  // Hover event listeners for all pronunciation triggers
  let currentTarget: HTMLElement | null = null;

  outputContent?.addEventListener('mouseover', (e) => {
    const target = (e.target as HTMLElement).closest('.pronunciation-menu-trigger');
    if (target) {
      currentTarget = target as HTMLElement;
      showMenu(target as HTMLElement, menu);
    } else if (!menu.contains(e.target as Node)) {
      hideMenu(menu);
    }
  });

  outputContent?.addEventListener('mouseout', (e) => {
    const target = e.relatedTarget as Node | null;
    const currentTargetEl = (e.target as HTMLElement).closest('.pronunciation-menu-trigger');
    if (!target || !menu.contains(target) && !currentTargetEl) {
      hideMenu(menu);
      currentTarget = null;
    }
  });

  // Click handler for menu items
  menu.addEventListener('click', (e) => {
    const item = (e.target as HTMLElement).closest('.pronunciation-menu-item');
    if (item && currentTarget) {
      const replacementChar = item.textContent;
      if (replacementChar && currentTarget) {
        // Replace the character in the output
        currentTarget.textContent = replacementChar;
        // Update the data attribute to reflect the new character
        currentTarget.setAttribute('data-char', replacementChar);
      }
      hideMenu(menu);
    }
  });

  // Hide menu when clicking outside
  document.addEventListener('click', (e) => {
    const target = (e.target as HTMLElement).closest('.pronunciation-menu-trigger');
    if (!menu.contains(e.target as Node) && !target) {
      hideMenu(menu);
    }
  });

  function showMenu(target: HTMLElement, menu: HTMLElement) {
    const data = target.getAttribute('data-multipronounce');
    if (!data) return;

    // Parse the data
    const pronunciations = data.split('|').map(item => {
      const [pronunciation, sameTone = '', differentTone = ''] = item.split(':');
      return {
        pronunciation,
        sameTone: sameTone.split(',').filter(Boolean),
        differentTone: differentTone.split(',').filter(Boolean)
      };
    });

    // Build the menu HTML
    let html = '';
    pronunciations.forEach(pronunciationData => {
      html += `<div class="pronunciation-group">`;
      html += `<div class="pronunciation-label">${pronunciationData.pronunciation}</div>`;

      // Add same tone alternatives
      pronunciationData.sameTone.forEach(char => {
        html += `<div class="pronunciation-menu-item">${char}</div>`;
      });

      // Add different tone alternatives
      pronunciationData.differentTone.forEach(char => {
        html += `<div class="pronunciation-menu-item">${char}</div>`;
      });

      html += `</div>`;
    });

    menu.innerHTML = html;

    // Position the menu
    const rect = target.getBoundingClientRect();
    menu.style.left = `${rect.left + window.scrollX}px`;
    menu.style.top = `${rect.bottom + window.scrollY}px`;
    menu.style.display = 'block';
  }

  function hideMenu(menu: HTMLElement) {
    menu.style.display = 'none';
  }
}