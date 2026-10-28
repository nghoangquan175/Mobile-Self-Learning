# 01 — Android and iOS: what a developer needs to build an app

> Researched on 2026-10-28. What it takes to build and ship on each platform — no code yet.

## 1. The user's view

| | Android | iOS |
|---|---|---|
| Runs on | Android phones/tablets (Samsung, Xiaomi, Oppo, Pixel…) | Apple devices only (iPhone, iPad) |
| Operating system | Android (Google) | iOS / iPadOS (Apple) |
| Where users get apps | **Google Play** — an APK can also be installed directly | **App Store** — practically the only way |

→ An app that "exists on both" is really **two separate builds**, submitted to **two separate stores**, each reviewed under its own rules.

## 2. The developer's view — summary

<table>
  <thead>
    <tr><th>#</th><th></th><th>Android</th><th>iOS</th></tr>
  </thead>
  <tbody>
    <tr>
      <td>1</td><td><b>Operating system</b> (of the dev machine)</td>
      <td><b>Windows, macOS or Linux</b></td>
      <td><b>macOS only</b></td>
    </tr>
    <tr>
      <td>2</td><td><b>Hardware</b> for dev and testing</td>
      <td>Any PC (16 GB RAM recommended) + a real Android phone</td>
      <td><b>A Mac</b> (Apple silicon, 16 GB RAM recommended) + a real iPhone</td>
    </tr>
    <tr>
      <td>3</td><td><b>IDE</b> (+ SDK and build tools it installs)</td>
      <td><b>Android Studio</b> — Android SDK, Gradle, JDK, Emulator</td>
      <td><b>Xcode</b> — iOS SDK, Simulator, signing tools</td>
    </tr>
    <tr>
      <td rowspan="2">4</td><td rowspan="2"><b>Language + UI framework</b></td>
      <td><b>Kotlin</b> + Jetpack Compose (older: Java, XML Views)</td>
      <td><b>Swift</b> + SwiftUI (older: Objective-C, UIKit)</td>
    </tr>
    <tr>
      <td colspan="2" align="center">React Native with JS/TS, Flutter with Dart</td>
    </tr>
    <tr>
      <td>5a</td><td><b>Local testing</b></td>
      <td><b>Emulator</b>, or a real phone over USB (<i>Developer options</i> + <i>USB debugging</i>)</td>
      <td><b>Simulator</b> (Mac only), or a real iPhone (<i>Developer Mode</i>; a free Apple ID only lasts ~7 days per install)</td>
    </tr>
    <tr>
      <td>5b</td><td><b>Pre-prod testing</b></td>
      <td>Internal / Closed / Open testing tracks in Play Console</td>
      <td><b>TestFlight</b></td>
    </tr>
    <tr>
      <td>6</td><td><b>Where it's published</b></td>
      <td><b>Google Play</b>, via Play Console — USD 25 one-time; uploads an <b>AAB</b> signed with a <b>keystore</b>; review takes hours to a few days</td>
      <td><b>App Store</b>, via App Store Connect — USD 99/year; uploads an <b>IPA</b> signed with a <b>certificate + provisioning profile</b>; review usually 1–2 days, stricter</td>
    </tr>
  </tbody>
</table>

## 3. React Native / Flutter: what decides Android vs iOS?

**Not the IDE, and mostly not the code — the platform's own build toolchain decides it, at build time.**

```
                 one shared codebase (JS/TS or Dart)
                                  │
   ① framework processes the code, once per target    ← RN bundles JS/TS · Flutter compiles Dart
                    ┌─────────────┴─────────────┐
       Android output                     iOS output
       RN: index.android.bundle           RN: main.jsbundle
       Flutter: libapp.so + assets        Flutter: App.framework + assets
                    │                           │
   ② android/ project                     ios/ project           ← real native projects, kept by the framework
     Gradle + Android SDK                 xcodebuild + iOS SDK   ← the same build tools native apps use
                    │                           │
               .aab / .apk                    .ipa
```

| Piece | Role |
|---|---|
| Code | Shared (~90%); small per-platform bits |
| Native build tools | **Decide the platform** — Android SDK + Gradle → Android, Xcode's tools (iOS SDK, compiler) → iOS |
| IDE | Just where you write code (VS Code…); the build tools run even without opening Android Studio/Xcode |
| Native plugins | Device features (camera, payments…) — need both an Android and an iOS part |

→ An iOS build still needs **a Mac with Xcode** (own or cloud).

**Where the ~10% platform-specific part lives**

| How | Example | Used by |
|---|---|---|
| `if/else` in code | `Platform.OS === "ios" ? 44 : 24` | The app, at runtime on the device |
| Per-platform files | `DatePicker.ios.tsx` / `DatePicker.android.tsx` | Step ① — picks the right file per target |
| Native config in `android/` / `ios/` | Permissions (`AndroidManifest.xml` / `Info.plist`), icon, app ID, push, signing | Step ② — Gradle / xcodebuild |

## 4. From development to release: web vs mobile

**The core difference:** a web release replaces the code on *your* server — everyone gets it on the next reload. A mobile release is a file installed on *the user's* phone — it goes through store review, and users update when they want.

```
code ─► CI: lint/test ─► build .aab + .ipa (signed) ─► internal test ─► TestFlight / Play testing ─► store review ─► phased rollout
                         (macOS runner for iOS)                                                      (1–2 days)      (e.g. 10% → 100%)
```

| Stage | Web | Mobile |
|---|---|---|
| CI runner | Any Linux runner | **2 builds, 2 parallel jobs**: Android on `ubuntu-latest`, **iOS on `macos-latest`** (10× minutes on private repos) |
| Build tools on CI | Node / Docker preinstalled | Preinstalled: Android SDK + JDK + Gradle (Ubuntu), **Xcode** (macOS). Workflow adds: Node/Flutter, `npm ci`, `pod install`, signing keys from secrets |
| Build output | Docker image / static files | Signed `.aab` and `.ipa` |
| Where builds are stored | **GHCR** (`docker push`) | **Play Console / App Store Connect** — only if CI has an upload step (`eas submit`, Fastlane); otherwise just a CI artifact (90 days) |
| CI credentials | `GITHUB_TOKEN` | Play **service account JSON**, **App Store Connect API key**, keystore + certificates — all in CI secrets |
| Versioning | Commit SHA is enough | Version (1.2.0) + build number that must increase on every upload |
| Release | Deploy — live in minutes | Store review (hours–days) → phased rollout |
| Rollback | Redeploy the previous version | **No real rollback** — halt the rollout and ship a newer fixed build |
| Old versions | Gone after deploy | Stay in use for months → the **API must stay backward compatible**, add a "force update" check |

**Common CI/CD tools:** Expo EAS (Build/Submit/Update), Fastlane, Codemagic, Bitrise, GitHub Actions (macOS runners for iOS).

## 5. Testing stage: from uploaded build to testers

Play Console (play.google.com/console) and App Store Connect (appstoreconnect.apple.com) are **websites** — the admin dashboard of the developer account; team members are invited by the account owner. Testers never use them.

A build is uploaded once and kept by the store. You pick a build and hand it to a group of testers, who install it on their real phones. The same tested build is then submitted for release — no rebuild.

| | Android — Play Console | iOS — App Store Connect |
|---|---|---|
| How | Create a release on a **track**, pick an uploaded build | **TestFlight** tab → pick a build → add tester groups |
| Test levels | **Internal** (≤ 100, almost instant) → **Closed** (email lists) → **Open** (anyone with the link) | **Internal** (≤ 100 team members, no review) → **External** (≤ 10,000 via email or public link; first build of a version needs beta review) |
| Testers install via | The join link, then **Google Play** on their Android phone | The **TestFlight** app on iPhone/iPad |
| Go live | Promote the build to the **Production** track | Pick the build on the App Store version → **Submit for Review** |

## 6. Lead times (non-coding)

| Item | Typical time |
|---|---|
| Google Play Console account | 1–3 days |
| Apple Developer account — individual / **company (D-U-N-S)** | 1–2 days / **1–3 weeks** |
| CI/CD + first signing setup | 2–5 days |
| Closed test, **personal** Play account | **14 days** (12 testers) |
| Store review per release | Android: hours–days · iOS: 1–2 days (first submission longer) |

→ Add **1–2 weeks** buffer to the first release, and get the client to create the store accounts in week 1.
