# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**FindApp** is a React Native application that collects user voice/text input and transcribes it to generate food/dining recommendations. It supports three modes:

- **Individual** — personal dining suggestions
- **Group** — recommendations that suit multiple people's preferences
- **Date** — curated suggestions for a two-person date setup

The core flow is: collect input → transcribe/process → surface ranked recommendations.

## Code Conventions

### TypeScript
- No `as` type assertions and no `any`. Use type guards, narrowing, or proper generics.

### Forms
- All forms use **TanStack Form**. Do not introduce a parallel `useState` error/validation pattern alongside it.

### Components
- Prefer reusable, shared components over duplicating similar UI across screens. Before creating a new component, check if an existing one can be extended or composed.

### Utilities & Helpers
- Utils, shared functions, and text formatters belong in global shared files (e.g., `src/utils/`). Never create one-off utility files scoped to a single feature or screen.

## Stack

- **Framework**: React Native with Expo (SDK 54+)
- **Navigation**: Expo Router (file-based, `app/` directory)
- **Styling**: NativeWind v4 — use `className` with Tailwind utility classes; `dark:` prefix for dark mode
- **Forms**: TanStack Form (`@tanstack/react-form`)
- **Language**: TypeScript (strict — no `any`, no `as` assertions)

### Styling rules
- All styling goes through NativeWind `className` props. Do not use `StyleSheet.create()` or raw `style={{}}` objects for static styles.
- Use `dark:` variants on every element that differs between themes — dark mode support is required on all components.
- Dynamic values that depend on runtime state (e.g. `opacity: pressed ? 0.5 : 1`) may stay in `style` prop alongside `className`.
- Custom fonts loaded via expo-font use `style={{ fontFamily: '...' }}` since Tailwind cannot reference dynamically loaded font names without extending `tailwind.config.js`.

## Commands

```bash
npx expo start          # start dev server (scan QR for device)
npx expo run:ios        # run on iOS simulator
npx expo run:android    # run on Android emulator
npx tsc --noEmit        # type-check
npx @biomejs/biome check --write <file>  # lint & format (do NOT use eslint or npx expo lint)
```

## Project Structure

```
app/          # Expo Router screens — file path = route
src/
  components/ # Reusable UI components
  types/      # Shared TypeScript interfaces/types — barrel: src/types/index.ts
  utils/      # Shared utilities and text formatters — barrel: src/utils/index.ts
```

New types go in `src/types/index.ts` (or a named file exported from the barrel for large domains). New utility functions and formatters go in `src/utils/` — never in a feature-local file.
