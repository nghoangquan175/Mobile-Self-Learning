# 02 — Mobile app core concepts (seen from web)

> Researched on 2026-10-28. Platform-agnostic concepts — no language or framework yet.

## 1. Architecture: still client ↔ API ↔ backend

```
      ┌───────────────────────────┐
      │ Phone                     │
      │   App (FE)                │
      │   screens · logic         │
      │   local storage           │
      └──────▲─────────────▲──────┘
             │             │
   ① request │ ② response  │ ③ push
     (HTTPS) │   (JSON)    │
             ▼             │
      ┌──────────────┐   ┌─┴──────────────┐
      │ Backend (BE) │──►│ Apple APNs /   │
      │ API server   │   │ Google FCM     │
      └──────────────┘   └────────────────┘

①② The app calls the backend API and gets JSON back — same as a web FE.
③  The backend can't reach the phone directly: it sends the push to Apple/Google, they deliver it.
```

| | Mobile app |
|---|---|
| Where the FE lives | **Installed on the device**, runs locally |
| Updating the FE | New build → store → users update when they want |
| Consequence | **Many app versions in use at once** → API must stay backward compatible, version it (`/v1`, `/v2`) |
| Talks to backend | REST / GraphQL over HTTPS — HTTPS is enforced by the OS |

## 2. App lifecycle (vs a browser tab)

| State | What it means | What to do |
|---|---|---|
| **Foreground (active)** | On screen, user interacting | Normal work |
| **Background** | User switched app / locked screen | Save state, stop heavy work — only seconds of runtime left |
| **Suspended** | In memory, frozen, no code runs | Nothing runs |
| **Killed** | OS removed it to free RAM, or user swiped it away | On next launch, restore where the user was |

Web tab: mostly just "open" or "closed". Mobile: the **OS decides** when the app is frozen or killed — you don't get a warning before a kill.

**Reopening: resumed or restarted?** When RAM runs low the OS kills background apps, oldest and heaviest first. Still frozen → resumes where it was; killed → **cold start**. The user can't tell which.

| More likely to be killed when | |
|---|---|
| Device | Cheap phone, 2–4 GB RAM; aggressive vendors (Xiaomi, Oppo, Samsung) or battery saver on |
| Other apps | User opens a game, camera, video… after yours |
| Your app | Long time in background, holds lots of memory (images, caches) |

Test it: Android *Developer options → Don't keep activities* kills the app every time it leaves the screen.

## 3. RAM and performance

| | Web | Mobile |
|---|---|---|
| Memory | The browser manages it; a heavy tab is slow | Tight budget per app; too much → **the OS kills the app** (looks like a crash) |
| Background apps | Tabs keep running (throttled) | Background apps get killed first when RAM runs low |
| Threads | One JS main thread + workers | The **main thread** (= UI thread) draws the screen and handles taps. If it's busy with a long task (parsing big JSON, decoding images), it can't redraw → the app freezes. So long tasks run on **background threads** (extra worker threads) and send the result back to the main thread |
| Battery | Rarely a concern | GPS, network polling, animations drain battery — the OS throttles apps that abuse it |
| Device range | Mostly fast laptops/phones | Cheap Android phones with 2–4 GB RAM are common — test on a weak device |

## 4. Storage (localStorage, cookies… on mobile)

Each app has its own **sandbox** — a private folder no other app can read. Everything in it is **deleted when the app is uninstalled** (the iOS Keychain is the exception, see below).

| Web | Mobile equivalent | Use for |
|---|---|---|
| `localStorage` | **Key-value storage** (Android SharedPreferences / DataStore, iOS UserDefaults) | Settings, flags, "seen onboarding" |
| — (cookies with `HttpOnly` are the closest) | **Secure storage** (Android Keystore, iOS **Keychain**) — encrypted by the OS | **Tokens**, passwords, secrets |
| IndexedDB | **Local database** (SQLite and libraries on top of it) | Offline data, lists, caching API results |
| Cache API / HTTP cache | File system cache folder | Images, downloaded files |
| `sessionStorage` | Just **in-memory state** | Data for the current run only — lost when the app is killed |

⚠️ Never put tokens in plain key-value storage — it's readable on a rooted/jailbroken phone or in a backup.

### Where it actually lives on the device

Libraries like AsyncStorage or `expo-sqlite` are JS wrappers; underneath, the data sits here. The sandbox root is `/var/mobile/Containers/Data/Application/<UUID>/` on iOS and `/data/data/<package>/` on Android.

| # | In Expo | **iOS** | **Android** |
|---|---|---|---|
| 1 | State (memory) | The app process's RAM (Hermes JS heap) — no file | Same |
| 2 | AsyncStorage | Files in `Library/Application Support/<bundleId>/RCTAsyncLocalStorage_V1/` (`manifest.json` + files for large values) | A SQLite database named **`RKStorage`** in `databases/` |
| | *Native key-value* | **UserDefaults** — a `.plist` in `Library/Preferences/` | **SharedPreferences** — XML in `shared_prefs/` (newer: **DataStore**) |
| | MMKV | Memory-mapped files in `Documents/mmkv/` | `files/mmkv/` |
| 3 | SecureStore | **Keychain** — an encrypted database run by the OS, **outside the sandbox** | **Android Keystore** holds the key in secure hardware (TEE/StrongBox); values encrypted with it are stored in **SharedPreferences** |
| 4 | expo-sqlite | A `.db` file in `Documents/SQLite/` | A `.db` file in `files/SQLite/` |
| | *Native database* | **Core Data** / **SwiftData** (SQLite underneath) | **Room** (SQLite underneath) |
| 5 | expo-file-system | `Documents/` (backed up to iCloud), `Library/Caches/` (the OS may clear it), `tmp/` | `files/` (internal), `cache/` (the OS may clear it), app-specific external `/sdcard/Android/data/<package>/` |

- **The iOS Keychain can survive an uninstall** (it's outside the sandbox) — a reinstall can read old tokens, so apps often clear it on first launch.
- **Natively it's almost all SQLite or files** — AsyncStorage on Android, Core Data and Room are SQLite underneath.
- **Caches can be wiped by the OS at any time** — never keep data that matters in `Caches/` / `cache/`.
- **In Expo Go** everything lives in Expo Go's own sandbox (`host.exp.exponent`), scoped per project; only a real build gets a sandbox under your own bundle ID / package.

## 5. Session & auth (no cookies by default)

| | Web | Mobile |
|---|---|---|
| Login session | Session cookie / `HttpOnly` cookie sent automatically | **Access token + refresh token** stored in Keychain/Keystore, sent manually in the `Authorization` header |
| Staying logged in | Cookie expiry | Refresh token renews the access token silently; users expect to stay logged in for weeks |
| Extra unlock | — | **Biometrics** (Face ID / fingerprint) to unlock the stored token |
| Social login | Redirect in the browser | Native SDKs (Google, **Sign in with Apple**) |
| Logout | Clear cookie | Delete tokens from secure storage + tell the backend |

## 6. Navigation (no URLs on screen)

| Web | Mobile |
|---|---|
| URL routes (`/products/42`) | **Screens** in a **stack**: push a screen on top, pop to go back |
| Browser back button | Android back button/gesture, iOS swipe-from-edge |
| Tabs/menus in the page | **Bottom tab bar**, drawer, **modals** sliding up |
| Links from outside | **Deep links**: `myapp://product/42` or a normal `https://` link that opens the app (Universal Links / App Links) |

## 7. Device access & permissions

| | Web | Mobile |
|---|---|---|
| Features | Camera, location, notifications — limited | Camera, GPS, contacts, photos, Bluetooth, NFC, biometrics, sensors… |
| Asking permission | Browser prompt | **Declared in the app config** + asked at runtime with a reason; user can revoke any time in Settings |
| Denied | Feature just doesn't work | Must handle "denied" and "denied forever" (send the user to Settings) |

## 8. Network: assume it's bad

| | Web | Mobile |
|---|---|---|
| Connection | Usually stable Wi-Fi | Switches 4G ↔ Wi-Fi, tunnels, elevators, airplane mode |
| Expected behaviour | Error page is acceptable | Show cached data, retry, queue actions until online (**offline-first** for apps that need it) |
| Speed/size | Rarely an issue | Mobile data costs money — compress images, paginate lists |

## 9. Notifications: push and local

### Push notifications (sent by a server)

```
your backend ──► APNs (Apple) / FCM (Google) ──► OS on the phone ──► notification shown
```

- The app registers with the OS and gets a **device token** → sends it to your backend → the backend sends pushes **through Apple/Google**, never directly to the phone.
- The user must allow notifications (iOS always asks; Android 13+ asks too).
- Tapping a notification usually opens a specific screen (a deep link).

### Local (scheduled) notifications (set by the app itself)

The app hands the schedule to the OS — like setting an alarm in the Clock app. When the time comes, the OS shows it, even if the app has been killed.

```
WHEN THE TASK IS CREATED (app open)
  JS: scheduleNotificationAsync({ title, body, trigger: { date } })
        │  expo-notifications (native module)
        ▼
  iOS:     UNUserNotificationCenter.add(request)      → the system stores the request
  Android: stores the request + AlarmManager.set(alarm) → the system holds an "alarm"
        │
        ▼  returns a notificationId → the app keeps it to cancel or change it later

  ... app killed, phone locked, no JS running ...

WHEN THE TIME COMES
  iOS:     the system shows the notification itself — the app doesn't run at all
  Android: AlarmManager wakes a small part of the app (a native BroadcastReceiver —
           no JS, no UI) → it builds the notification → NotificationManager shows it
        │
        ▼
  The user taps it → the app opens (a cold start if it had been killed)
```

- **Your JS doesn't run when it fires**, so the content (title, time) is fixed when it's scheduled — editing a task means cancelling and scheduling again.
- **iOS** keeps the schedule across reboots; at most **64** pending per app.
- **Android** loses alarms on reboot (expo-notifications reschedules on `BOOT_COMPLETED`); **Force stop** cancels them until the user opens the app; exact timing needs the exact-alarm permission.

| | **Local** | **Push** |
|---|---|---|
| Who decides to send | The app, when scheduling | The server |
| Path | App → OS holds the schedule → OS shows it | Server → APNs / FCM → OS shows it |
| Needs network | No | Yes |
| Knows about new changes | No — only what was scheduled | Yes — the server can send any time |
| Good for | Reminders, alarms, timers | New messages, assigned tasks, multi-device sync |

## 10. Screens & UI units

| | Web | Mobile |
|---|---|---|
| Unit | `px`, `rem` | **dp** (Android) / **pt** (iOS) — density-independent; 1 dp ≈ 1 px on a low-density screen, 3 px on a high-density one |
| Layout | Responsive breakpoints | Many sizes + **safe area** (notch, rounded corners, home indicator) + rotation |
| Images | One image + `srcset` | Export **@1x / @2x / @3x** (or vector icons) |
| Text size | Browser zoom | User's system font size — layouts must survive large text |
| Dark mode | Optional | Expected — follows the system setting |

**@1x / @2x / @3x** — a 100 dp icon needs 100 / 200 / 300 px depending on screen density. Export all three, the OS picks the right one (too small → blurry). Vector icons need just one file.

**Safe area** — screen parts that are covered or shouldn't hold content: notch / Dynamic Island, rounded corners, status bar, iPhone home bar. The OS gives their insets; keep buttons out of them. **Rotation** — re-layout for landscape, or lock the app to portrait.

## 11. Mobile-only concepts (no real web equivalent)

| Concept | What it is |
|---|---|
| **Gestures & haptics** | Swipe, long press, pinch, pull-to-refresh; small vibrations as feedback |
| **Soft keyboard** | The on-screen keyboard covers half the screen — inputs must scroll into view, keyboard type per field (number, email) |
| **Local notifications** | Scheduled by the app itself, no backend needed (reminders, alarms) |
| **Background modes** | Limited, declared ways to keep running in the background: location tracking, audio playback, uploads, periodic fetch |
| **Hardware & sensors** | GPS, camera, biometrics, Bluetooth, NFC, accelerometer/gyroscope |
| **App icon, splash screen, badge** | Home-screen icon, the screen shown while launching, the red number on the icon |
| **Widgets & extensions** | Home/lock-screen widgets, share sheet ("Share to…"), live activities |
| **Inter-app actions** | Open the phone dialer, maps, mail, other apps; receive files shared from other apps |
| **In-app purchases** | Payments for digital goods/subscriptions through Apple/Google |
| **In-app review prompt** | The OS "Rate this app" pop-up, limited to a few times a year |
| **Accessibility** | Screen readers (VoiceOver / TalkBack), system font size, reduced motion |
| **Device fragmentation** | Many OS versions in use at once — decide the minimum OS version to support |
