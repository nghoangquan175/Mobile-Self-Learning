# 07 — The libraries in Todo-RN

Tech lead: *use AI freely, but know which libraries you're using.* UI logic is the same as web; these are
the mobile parts. Checked against `C:\PROJECT\Personal\Todo-RN` (Expo SDK 58) on 2026-10-30.

`package.json` lists ~26 packages, but the app code imports only **8**. The rest are the platform, things
Expo Router or `app.json` need, or leftovers from the `create-expo-app` template.

## 1. Used directly in the code — know these well

| Library | What it does here | Web equivalent |
|---|---|---|
| `react-native` | Core components: `View`, `Text`, `Pressable`, `TextInput`, `Modal`, `StyleSheet`, `Platform`. RN maps them to **native iOS/Android views** — there is no DOM | `div`, `span`, `button`, `input` + CSS |
| `expo-router` | Routing from the files in `src/app/`. This app has one screen inside a `Stack` (new screen slides on top, swipe back) | Next.js App Router |
| `@react-native-async-storage/async-storage` | Saves the todo list on the phone as key-value. Unlike web: the API is **async**, data is **not encrypted**, and it's gone when the app is uninstalled | `localStorage` |
| `expo-notifications` | **Local** reminder notifications: ask permission, create the Android channel, schedule and cancel. No push from a server | Web Notifications API — but these fire even when the app is closed |
| `@react-native-community/datetimepicker` | **Native** date/time pickers: inline in the sheet on iOS, a separate dialog on Android — hence the `if (Platform.OS === ...)` in the code | `<input type="date">` |
| `react-native-safe-area-context` | Keeps content clear of the notch, Dynamic Island and the system nav bar | `env(safe-area-inset-*)` in CSS |
| `expo-status-bar` | Colour of the status bar text (clock, battery) at the very top | — |

## 2. Platform and what Expo Router needs — know what they're for

- **`expo`** — the framework around RN: SDK, CLI, `prebuild`, and the EAS link. The SDK version (58) decides
  the version of every `expo-*` package, so add libraries with **`npx expo install`**, not plain `npm i`,
  and it picks the matching version.
- **`react`** 19.3, **`react-native`** 0.88.
- **Required by Expo Router:** `react-native-screens` (real native screens), `expo-constants`,
  `expo-linking` (deep links, `todorn://` from `scheme` in `app.json`).
- **Config, not code:** `expo-splash-screen` (plugin in `app.json`: splash image + colour),
  `expo-system-ui` (applies `userInterfaceStyle` and the root background natively), `expo-font`
  (a dependency of `expo` itself).
- **Optional for Expo Router, but keep them:** `react-native-gesture-handler` (native touch/swipe),
  `react-native-reanimated` + `react-native-worklets` (animations that run off the JS thread). Nothing in
  this app imports them, but almost every real app ends up using them, directly or through another library.
- **Outside `package.json`:** **EAS** (Expo's cloud build + submit service) and **Gradle** (the Android
  build tool, used when building the APK on a runner).

## 3. Installed but unused — template leftovers

| Package | Note |
|---|---|
| `expo-device`, `expo-glass-effect`, `expo-image`, `expo-symbols`, `expo-web-browser`, `@expo/ui` | From the template's demo screens; nothing in the app uses them |
| `react-dom`, `react-native-web` | Only for the **web** build (`npm run web`, `web` in `app.json`). Keep them only if the web version matters |

Removable to keep things tidy — run `npx expo-doctor`, lint, typecheck and a build afterwards.

## 4. Points worth being able to explain

- **Expo vs bare React Native** — Expo doesn't lock you in. Native code is still possible through
  `prebuild` (generates `ios/` and `android/`) and your own native modules.
- **Why library versions must match the SDK** — libraries ship native code; a version mismatch breaks the
  native build, which never happens on web.
- **AsyncStorage is not for tokens or passwords** — sensitive data goes in `expo-secure-store`
  (iOS Keychain / Android Keystore).
- **Local vs push notifications** — push needs a server, APNs (iOS) / FCM (Android) and a device push
  token. This app doesn't touch that yet.
