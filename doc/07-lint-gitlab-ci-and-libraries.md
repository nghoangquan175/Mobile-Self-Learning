# 07 — Lint fixes, moving to GitLab, and the libraries in Todo-RN

Session of 2026-10-30, on the practice app `C:\PROJECT\Personal\Todo-RN`.

## 1. Health check

| Check | Result |
|---|---|
| `git status` | Clean, in sync with the remote |
| `npx tsc --noEmit` | No type errors |
| `npx expo-doctor` | 20/20 checks passed |
| CI (GitHub Actions, 2026-10-29) | iOS → TestFlight ✅ 7m50s · Android → APK ✅ 20m47s |
| `.gitignore` | `*.jks`, `*.p8`, `*.p12`, `*.key`, `*.mobileprovision`, `android/`, `dist/` all ignored |
| `npx expo lint` | **4 errors** — see §2 |

The Android build takes ~3× the iOS one; Gradle caching in CI could cut it down.

## 2. Lint errors and fixes

The first `npx expo lint` run **installs ESLint by itself**: it adds `eslint` + `eslint-config-expo` to
`devDependencies` and creates `eslint.config.js`. Commit those so `npm run lint` works on other machines and in CI.

| Where | Error | What it meant | Fix |
|---|---|---|---|
| `src/app/index.tsx:153` | `react/jsx-no-comment-textnodes` | `// {formatDay(...)}` in JSX looks like a comment to ESLint, but it's visible text (the eyebrow line) | Render the prefix as a string: `{"// "}{formatDay(day).toUpperCase()}` |
| `src/components/todo-sheet.tsx:88`, `:208` | `react-hooks/purity` — *Cannot call impure function during render* | `Date.now()` returns something different on every render. With the **React Compiler** on (`reactCompiler: true`) render must be pure. In practice "past" and "too early to remind" only updated when something else re-rendered the sheet | Read the clock into state when the sheet opens and tick it every 30 s (below) |
| `src/lib/notifications.ts:33` | `import/namespace` — `'AndroidImportance' not found` | **False positive**: `expo-notifications` re-exports it from a `.types` module the import plugin can't follow; `tsc` is fine with it | `// eslint-disable-next-line import/namespace -- <reason>` |

```tsx
const [now, setNow] = useState(Date.now);
useEffect(() => {
  const id = setInterval(() => setNow(Date.now()), 30_000);
  return () => clearInterval(id);
}, []);
// then use `now` instead of Date.now() in render
```

## 3. Why CI didn't run on push

Both GitHub workflows only have `on: workflow_dispatch` — they run when you press **Run workflow**
(or `gh workflow run ios.yml`), never on push. This was on purpose:

- **Cost** — iOS builds count against the EAS plan; the Android job takes ~21 runner minutes.
- **Every build is a release** — `autoIncrement` bumps the build number and testers get a new TestFlight
  build. A lint-only commit shouldn't ship one.
- **Setup phase** — easier to control while trying things out.

Ways to automate later:

| Trigger | When it fits |
|---|---|
| Push to `main` + `paths: [src/**, app.json, package.json, ...]` | Build on code changes, skip docs/CI-only commits |
| Push a tag `v1.0.1` | Build only when you deliberately cut a release — the most common setup for real apps |
| `eas update` (OTA) | JS-only changes reach installed apps **without a new build**; native changes (new native library, `app.json`) still need a build |

Common team setup: lint + typecheck on every push/MR; build and distribute on a tag or by hand.

## 4. Moving the repo to the company GitLab

Repo: `https://git.moha.team/quan.nguyen/get-it-done`

```bash
git remote add gitlab https://git.moha.team/quan.nguyen/get-it-done.git
git push -u gitlab main      # main now tracks gitlab/main
git push origin main         # GitHub has to be named explicitly
```

- Scan the history for secrets **before** pushing anywhere new — nothing found: CI only references
  `secrets.EXPO_TOKEN`, and signing keys live on EAS.
- `.github/workflows/*.yml` is **ignored by GitLab** — CI has to be rewritten as `.gitlab-ci.yml` (§6).
- GitLab created a pipeline even without `.gitlab-ci.yml` → probably **Auto DevOps**. Once a
  `.gitlab-ci.yml` exists, Auto DevOps no longer runs.
- Commits still carry the personal GitHub noreply identity. Open questions: does this become a company
  project (→ `quan.nguyen@mohasoftware.com`)? Keep the GitHub remote?

## 5. `EXPO_TOKEN` on GitLab

A GitHub secret **can't be read back** (not even with `gh`), so it can't be copied. Make a **new token per
CI** — if one leaks you revoke just that one.

**Don't paste tokens into chat** — the UI route sends the token straight from Expo to GitLab. (Doing it
through the API would also need a GitLab Personal Access Token with `api` scope; the password stored for
`git push` gets `401` from the API.)

### Step 1 — Expo

1. https://expo.dev, logged in as `quannh1705` → avatar → **Account settings → Access tokens**.
2. **Create token**, name it `gitlab-ci-get-it-done`.
3. **Copy it now** — it's shown only once.

### Step 2 — GitLab

Project → **Settings → CI/CD → Variables → Expand → Add variable**:

| Field | Value |
|---|---|
| Type | Variable |
| Environments | All (default) |
| Visibility | **Masked** (or **Masked and hidden**) |
| Protect variable | ✅ |
| Expand variable reference | ❌ |
| Key | `EXPO_TOKEN` |
| Value | the token |

- *Masked* hides it in job logs. If GitLab refuses to mask it, check for a stray space or newline.
- *Protected* = only pipelines on **protected branches/tags** (default: `main`) can read it. A job on
  another branch complaining about a missing `EXPO_TOKEN` → protect that branch or untick this.

## 6. `.gitlab-ci.yml`

| Job | When | What |
|---|---|---|
| `check` | Automatic, every push and MR | `tsc --noEmit` + `npm run lint` |
| `ios` | Manual (▶), `main` only, after `check` | `eas-cli build --platform ios --profile production --auto-submit` on **EAS cloud** → TestFlight |
| `android` | Manual (▶), `main` only, after `check` | `expo prebuild` + Gradle → APK under the job's **Artifacts** (30 days) |

Differences from GitHub:

- **iOS** — GitHub builds with `eas build --local` on a macOS runner. The company GitLab has no macOS
  runner, so it builds on EAS's cloud: uses the EAS plan's build quota, may queue (job timeout 90 min).
  `--auto-submit` uses the `submit.production` profile in `eas.json`.
- **Android** — same steps, in the `reactnativecommunity/react-native-android` Docker image (JDK 17 +
  Android SDK + Node). Build number = `$CI_PIPELINE_IID` (GitHub: `$GITHUB_RUN_NUMBER`).

GitHub Actions → GitLab CI cheat sheet:

| GitHub Actions | GitLab CI |
|---|---|
| `on: workflow_dispatch` | `rules: ... when: manual` |
| `runs-on: ubuntu-latest` | `image: node:22` on a Docker runner |
| `actions/setup-node` with `cache: npm` | `cache:` keyed on `package-lock.json`, `npm ci --cache .npm` |
| `concurrency: group` | `resource_group` |
| `timeout-minutes` | `timeout` |
| `actions/upload-artifact` | `artifacts: paths / expire_in` |
| `secrets.X` | CI/CD variable `$X` |

Not verified yet: a job stuck in *pending* = no runner for the project (ask DevOps); the Android image
uses `latest`, so pin a tag if a build breaks on SDK/NDK/Node versions.

## 7. The libraries — what you have to know

Tech lead: *use AI freely, but know which libraries you're using.* UI logic is the same as web; these are
the mobile parts. `package.json` lists ~26 packages, but the app code imports only **8**.

### Used directly in the code — know these well

| Library | What it does here | Web equivalent |
|---|---|---|
| `react-native` | Core components: `View`, `Text`, `Pressable`, `TextInput`, `Modal`, `StyleSheet`, `Platform`. Mapped to **native views**, no DOM | `div`, `span`, `button`, `input` + CSS |
| `expo-router` | File-based routing in `src/app/`; this app uses one `Stack` (new screen on top, swipe back) | Next.js App Router |
| `@react-native-async-storage/async-storage` | Saves the todo list on the phone as key-value. **Async**, **not encrypted**, wiped on uninstall | `localStorage` |
| `expo-notifications` | **Local** reminder notifications: ask permission, Android channel, schedule/cancel. No server push | Web Notifications API — but fires even when the app is closed |
| `@react-native-community/datetimepicker` | **Native** date/time picker: inline on iOS, a dialog on Android → `if (Platform.OS === ...)` | `<input type="date">` |
| `react-native-safe-area-context` | Keeps content clear of the notch, Dynamic Island, nav bar | `env(safe-area-inset-*)` |
| `expo-status-bar` | Colour of the status bar text (clock, battery) | — |

### Platform and build tooling — know what they're for

- **`expo`** — the framework around RN: SDK, CLI, `prebuild`. The SDK version (58) pins every `expo-*`
  package → add packages with `npx expo install`, not plain `npm i`, so versions match.
- **`react`** 19.3, **`react-native`** 0.88.
- **`react-native-screens`**, **`react-native-gesture-handler`**, **`react-native-reanimated`** +
  **`react-native-worklets`** — needed under expo-router (native screens, swipe gestures, animations off
  the JS thread). Not imported, but can't be removed.
- **`expo-splash-screen`**, **`expo-constants`**, **`expo-linking`**, **`expo-font`**, **`expo-system-ui`** —
  used by the router and `app.json` (splash, deep link `todorn://`, system background colour).
- **`expo-device`** — real device or simulator (notifications don't work on a simulator).
- Outside `package.json`: **EAS** (Expo's build + submit service) and **Gradle** (Android build tool).

### Installed but unused — template leftovers

`@expo/ui`, `expo-glass-effect`, `expo-image`, `expo-symbols`, `expo-web-browser`, `react-native-web`,
`react-dom` — from `create-expo-app`'s demo screens. Removable, but rebuild after removing (the router may
still use some for the web build).

### Points worth being able to explain

- **Expo vs bare React Native** — Expo doesn't lock you in; native code is still possible via `prebuild`
  and custom modules.
- **Why versions must match the SDK** — libraries have native code; a mismatch breaks the build, unlike web.
- **AsyncStorage is not for tokens or passwords** — use `expo-secure-store` (Keychain / Keystore).
- **Local vs push notifications** — push needs a server, APNs/FCM and a device token; this app doesn't
  touch that yet.
