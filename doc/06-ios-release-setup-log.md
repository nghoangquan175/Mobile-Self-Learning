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
