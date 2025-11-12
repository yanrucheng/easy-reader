```
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.
```

## Commands

### Development
- `npm run dev`: Start Vite development server
- `npm run build`: Build production bundle (TypeScript + Vite)
- `npm run preview`: Preview production build
- `npm run type-check`: Run TypeScript type checking

## High-Level Architecture

This is a single-page application (SPA) that converts rare Chinese characters to pinyin using a frequency-based approach.

### Core Components
- **HTML UI** (`index.html`): Provides the user interface with two columns (input/output), a top-K slider, and copy functionality.
- **Main Logic** (`src/main.ts`): Contains all application logic including:
  - Character frequency filtering
  - Pinyin conversion using the `pinyin` npm package
  - HTML rendering of results
  - User interaction handling
- **Data Source** (`character-frequency.json`): Contains a sorted list of Chinese characters by frequency, used to determine which characters to convert.

### Key Functionality
- **Top-K Filtering**: Only converts characters outside the top-K most frequent (default 2500)
- **Dual Output**:
  - HTML view with highlighted pinyin replacements
  - Plain text copy functionality with raw pinyin
- **Responsive Design**: Adapts to mobile screen sizes

### Technology Stack
- TypeScript
- Vite
- pinyin npm package
- CSS custom properties for dark/light mode
