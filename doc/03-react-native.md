# 03 — React Native

> Researched on 2026-10-28. React Native seen from a React/TypeScript web developer.

## 1. What it is

| | |
|---|---|
| Made by | Meta (2015), open source |
| You write | **React + TypeScript** — components, hooks, props, state, same as web |
| You get | A real Android app and a real iOS app from one codebase |
| UI | Your components become **real native UI** (Android views / iOS UIKit), not HTML in a WebView |
| Used by | Facebook, Instagram, Discord, Shopify, Microsoft apps… |

## 2. How it runs

Inside a running app there are two "workers":

| Worker | Does | Web equivalent |
|---|---|---|
| **JS thread** | Runs your React code (components, state, `onPress`, API calls) on the **Hermes** engine | Chrome's V8 running your JS |
| **UI thread** | Draws the **real native** buttons/text/lists and receives touches | The browser drawing the DOM |

They talk through **JSI** (a fast direct link). Example — user taps a "Like" button:

```
UI thread                         JS thread
1. finger taps the button   ───►  2. onPress runs → setLiked(true)
                                   3. React works out the new screen
5. redraws the native button ◄───  4. "change this button to red"
```

When JS needs a device feature (camera, secure storage, push), it calls a **native module** — Kotlin/Swift code — the same way, through JSI.

## 3. Web React → React Native

| Web | React Native |
|---|---|
| `<div>` | `<View>` |
| `<p>`, `<span>` | `<Text>` — **all text must be inside `<Text>`** |
| `<img>` | `<Image>` |
| `<button>`, `onClick` | `<Pressable>`, `onPress` |
| `<input>` | `<TextInput>` |
| Scrolling page | `<ScrollView>`; long lists → `<FlatList>` (renders only what's visible) |
| CSS / Tailwind | `StyleSheet` objects (camelCase, numbers = dp) or **NativeWind** (Tailwind for RN) |
| Flexbox (row by default) | Flexbox **column by default**, no CSS cascade, no grid |
| React Router / Next routes | **Expo Router** (file-based, like Next) or React Navigation |
| `fetch` / axios | Same |
| `localStorage` | AsyncStorage / MMKV; tokens in **SecureStore** |

## 4. Expo vs bare React Native

| | **Expo** (recommended) | Bare React Native |
|---|---|---|
| What | A framework + tools on top of RN — like Next.js is to React | RN alone, you manage `android/` and `ios/` by hand |
| Native folders | **Generated** from `app.json` config (`npx expo prebuild`) — usually not committed | Committed and edited by hand |
| Device features | Ready modules: camera, notifications, secure store, image picker… | Pick and wire libraries yourself |
| Build & release | **EAS Build / Submit / Update** — cloud builds iOS without a Mac, OTA updates | Your own CI (Fastlane, GitHub Actions) |
| Custom native code | Still possible (dev builds, config plugins) | Full control |

The official RN docs recommend starting with a framework → **Expo** is the default choice today.

## 5. Project structure (Expo)

```
my-app/
├── app/                 screens = routes (Expo Router), e.g. app/(tabs)/index.tsx
│   └── _layout.tsx      shared layout / navigation, like Next's layout.tsx
├── components/          reusable components
├── assets/              images, fonts, icon, splash
├── app.json             app name, IDs, icon, permissions, plugins → becomes the native config
├── eas.json             build profiles (development / preview / production)
└── package.json
```

## 6. Common libraries

| Need | Usual pick |
|---|---|
| Navigation | Expo Router |
| Server data / caching | TanStack Query |
| App state | Zustand (or Redux Toolkit) |
| Forms | React Hook Form + Zod |
| Styling | NativeWind or StyleSheet |
| Long lists | FlashList |
| Animations / gestures | Reanimated + Gesture Handler |
| Storage | expo-secure-store (tokens), MMKV / AsyncStorage, expo-sqlite |
| Push | expo-notifications |
| Crash reporting | Sentry |

## 7. Dev setup on Windows

| Tool | Why |
|---|---|
| Node.js (LTS) + VS Code | Write and run the JS side |
| Android Studio | Android SDK + **emulator** only — not used as the editor |
| A real Android phone + **Expo Go** | Scan a QR code, the app runs on the phone with live reload |
| Expo account | EAS Build in the cloud — including **iOS builds without a Mac** |
| ❌ iOS Simulator | Not available on Windows → needs a Mac; iOS testing via TestFlight on someone's iPhone |

Daily loop: `npx expo start` → Metro (the JS bundler) serves the code → save a file → **Fast Refresh** updates the app in about a second.

## 8. Watch out for

| | |
|---|---|
| Native module missing | If no library covers a device feature, someone writes Kotlin/Swift |
| Library compatibility | Check a library supports Expo + the New Architecture before adding it |
| Performance | Long lists → FlashList, animations → Reanimated (runs on the UI thread), avoid heavy work on the JS thread |
| Upgrades | RN/Expo versions move fast — upgrade regularly (Expo SDK roughly every few months) |
| Expo Go limits | Custom native code doesn't run in Expo Go → use a **development build** |
