# 06 — iOS release setup: what we did

> Done on 2026-10-29 for the Todo-RN app ("Get It Done"). Goal: build the iOS app in CI and get it to TestFlight. Concepts are in [05](05-test-and-distribute.md) §5–7; IDs and expiries in Todo-RN's `docs/store-setup.md`.

## 1. Expo / EAS

| Step | Result | Why |
|---|---|---|
| Create an **access token** on expo.dev → GitHub secret `EXPO_TOKEN` | CI (and local commands) can act as the Expo account without logging in | No one is there to type a password in CI |
| `eas init` | Project **@quannh1705/todo-rn** on expo.dev; `projectId` + `owner` in `app.json` | EAS needs a project to store credentials under |
| `eas.json` | `preview` → Android APK for testers · `production` → auto-incremented build numbers, kept on EAS (`appVersionSource: remote`) | Defines the build types |
| `app.json` | `ios.bundleIdentifier` / `android.package` = `com.quannh.getitdone` · `ITSAppUsesNonExemptEncryption: false` | App identity · stops builds stalling at *Missing Compliance* |

## 2. Apple — `eas credentials -p ios` (run by hand: Apple login + 2FA)

| Created | What it is |
|---|---|
| **Bundle ID** `com.quannh.getitdone` | Registered in the company team (MOHA, `35SMCZBTSC`) |
| **Distribution certificate** | EAS made a key pair, sent the **CSR** (public key) to Apple, Apple signed it → certificate. EAS keeps the **private key**. Expires 2027-10-29 |
| **Provisioning profile** (App Store) | Apple-signed file: App ID + allowed certificates. Expires 2027-10-29 |
| **App Store Connect API key** | A "key for machines" (`.p8` + Key ID + Issuer ID) so CI can upload to TestFlight **without 2FA** |

All of it is stored on **EAS**, none in the repo. Team / Provider prompts → pick the company, never a personal team.

## 3. App Store Connect

- Order matters: **register the Bundle ID first** (step 2), then **New App** — the form only lists registered Bundle IDs.
- New App: name, language, Bundle ID, **SKU** `com.quannh.getitdone` (internal code, never shown to users, can't change).
- The app's **Apple ID** `6828363891` → `eas.json` `submit.production.ios.ascAppId`, so `eas submit` knows where to upload.
- Once the app exists, the Bundle ID is **locked**.

## 4. CI — GitHub Actions, option B

`.github/workflows/ios.yml`, manual trigger only:

```
macOS runner → pick Xcode → Node + EAS CLI (auth via EXPO_TOKEN) → npm ci
  → eas build --local   (builds the .ipa ON the runner, fetching cert + profile from EAS)
  → eas submit          (uploads to TestFlight with the API key)
  → .ipa kept as an artifact
```

- **Why B:** CI/CD stays on GitHub, but EAS handles the hard signing part, and no EAS build quota is used.
- **Cost:** private repo → macOS minutes count 10× → the free tier is roughly 6–8 iOS builds a month.

## 5. Still to do

- [ ] First workflow run — read the log and fix whatever fails
- [ ] TestFlight: Internal group → add testers → install on the company iPhone
- [ ] Bundle ID is now locked as `com.quannh.getitdone` — tell the tech lead
- [ ] Android: APK with the `preview` profile
- [ ] Replace `EXPO_TOKEN` (the current one was shared in chat)
