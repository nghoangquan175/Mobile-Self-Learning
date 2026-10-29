# 06 — iOS release setup: GitHub, Expo (EAS), App Store

## 1. `EXPO_TOKEN`

A **"password for machines"**: it lets the GitHub runner log in to your Expo account.

Why it's needed: everything for signing and uploading the app lives on **EAS**, not on GitHub:
- Certificate + private key
- Provisioning profile
- API key for uploading to the App Store
- The current build number

```
GitHub runner ──(EXPO_TOKEN)──► EAS: "give me the cert, profile, API key for todo-rn"
                ◄── EAS sends them ──
```

## 2. `eas credentials -p ios` — signing papers from Apple

Run by hand, logged in to the **company Apple account** (2FA). EAS deals with Apple for you:

| Created | For |
|---|---|
| **Bundle ID** `com.quannh.getitdone` | Registers the app's identity with Apple |
| **Distribution certificate** (+ private key) | **Signs** the `.ipa` — proves the app is from the MOHA team |
| **Provisioning profile** | Apple-signed permission: "this app may be signed with this certificate" |
| **App Store Connect API key** | Lets CI **upload without 2FA** (see §4) |

All four are stored on **EAS** — which is why the GitHub runner needs `EXPO_TOKEN`.

## 3. App Store Connect — the app's home on the store

The company's dashboard for its App Store apps (the Play Console of iOS).

- **New App** with the Bundle ID from §2 → App Store Connect gives it an **Apple ID**: `6828363891`.
- That number goes into `eas.json` (`ascAppId`) so `eas submit` knows which app to upload to.
- Every uploaded build then shows up in the app's **TestFlight** tab.

**Order:** §2 before §3 — the New App form only lists registered Bundle IDs.

## 4. App Store Connect API key

A key that lets **tools** (`eas submit`, fastlane) call Apple's API — upload builds, manage TestFlight — **without an Apple ID login or 2FA**, which CI can't do.

| Part | What |
|---|---|
| `.p8` file | The private key — Apple lets you download it **once** |
| Key ID | Which key it is |
| Issuer ID | Which organization (the company) |

- Lives in App Store Connect → **Users and Access → Integrations → App Store Connect API → Team Keys** — only Admins / the Account Holder see it.
- Belongs to the **team**, not a person; one key works for every app of the team.
- Here EAS generated it during `eas credentials` and keeps it on EAS; `eas submit` in CI uses it.

## 5. CI/CD workflow — GitHub Actions

`.github/workflows/ios.yml` in Todo-RN, run by hand (**Actions → iOS → TestFlight → Run workflow**):

```
GitHub macOS runner
  1. checkout code
  2. pick Xcode, install Node + EAS CLI (logs in with EXPO_TOKEN)
  3. npm ci
  4. eas build --local -p ios    → builds the .ipa ON the runner, signing with cert + profile from EAS
  5. eas submit -p ios           → uploads to TestFlight with the API key from EAS (ascAppId: 6828363891)
  6. keep the .ipa as an artifact (7 days)
```

| | |
|---|---|
| Who does what | **GitHub** runs the build · **EAS** holds the signing credentials · **App Store Connect** receives the build |
| Why `--local` (option B) | Build stays on GitHub's runner; EAS only provides credentials — no EAS build quota used |
| Cost | Private repo → macOS minutes count 10× → ~6–8 iOS builds a month on the free tier |
| First run (2026-10-29) | ✅ build + upload in ~8 minutes |

After upload: App Store Connect → **TestFlight** → wait for *Processing* → Internal group → add testers → install via the TestFlight app.
