# Unforget — Developer Guide

Unforget is a client-only mobile application built with React Native, TypeScript, Expo, and Expo Router. There is no server in this project. Personal advice and scheduling data will remain on the device when persistence is added.

## Requirements

- Node.js LTS
- npm, included with Node.js
- One of the following for previewing the app:
  - Expo Go on an Android or iOS device
  - Android Studio with an Android emulator
  - Xcode with an iOS simulator on macOS

## Install

From the project root:

```bash
npm install
```

## Execute

Start the Expo development server:

```bash
npm start
```

The Expo terminal then provides shortcuts for opening the project. The platform scripts can also be run directly:

```bash
npm run android
npm run ios
```

To clear the Metro cache when troubleshooting:

```bash
npm run start:clear
```

## Project structure

```text
unforget/
├── app/                       # Pages and navigation
│   ├── _layout.tsx            # Root stack layout
│   └── (tabs)/                # Route group for the bottom tabs
│       ├── _layout.tsx        # Tab names and tab-bar configuration
│       ├── index.tsx          # Remember tab and initial page
│       └── archive.tsx        # Archive tab
├── assets/
│   └── logo.png               # Brand and application icon
├── components/
│   └── AdviceCard.tsx         # Reusable presentation component
├── app.json                   # Expo application configuration
├── package.json               # Dependencies and scripts
└── tsconfig.json              # TypeScript configuration
```

## How routing works

Expo Router turns files inside `app/` into pages. `index.tsx` is the default page for its directory, while `_layout.tsx` defines how sibling pages are presented.

The `(tabs)` directory is a route group. Parentheses organize pages without adding `(tabs)` to the route path. Its `_layout.tsx` creates the tab navigator and maps the route files to the visible tab labels:

- `index.tsx` is shown as **Remember**.
- `archive.tsx` is shown as **Archive**.

The visible tab name is set in `(tabs)/_layout.tsx`; it does not need to match the filename. Reusable components stay outside `app/` so Expo Router does not treat them as pages.
