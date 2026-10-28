# 04 — Errors log

## 1. Android Emulator missing, no virtual device
- Android Studio installed, but the SDK had no **Emulator** package and no **system image** → no AVD.
- Fix: Android Studio → *Device Manager → Create Virtual Device* (or `sdkmanager` + `avdmanager`).

## 2. `package.json` is not valid JSON — `Unexpected token '﻿'`
- JSON files edited with PowerShell 5.1 `Set-Content` → a **BOM** was added at the start of the file.
- Fix: re-save as *UTF-8* (not *with BOM*). Don't edit JSON with PowerShell 5.1.

## 3. Expo Go: `Failed to download remote update`
- The emulator couldn't fetch code from Metro at `exp://<LAN IP>:8081` (firewall or slow first bundle).
- Fix: `adb reverse tcp:8081 tcp:8081` → open `exp://127.0.0.1:8081`, or press `r` to reload.

## 4. `tsc` errors in the fresh template (not blocking)
- Missing types for `.css` imports + a `ref` type error in `app-tabs.web.tsx` (web only).
- From the template itself; the app runs fine on Android.
