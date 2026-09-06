# WeebHub Mobile Server Contribution Guide

WeebHub Mobile Server is the Android and iOS mobile backend for the WeebHub ecosystem. It is maintained by BiniFn and is a modified fork of [Seanime Server Mobile](https://github.com/5rahim/seanime-server-mobile).

## Prerequisites

- Node.js 22 or newer and npm
- Go 1.26 or newer
- `gomobile`
- JDK and Android Studio for Android
- Xcode for iOS builds

## Local setup

```bash
git clone https://github.com/BiniFn/WeebHub-Mobile-Server.git
cd WeebHub-Mobile-Server
npm install
npx tsc --noEmit
```

## Building the embedded server

The native wrapper consumes a gomobile binding built from [WeebHub](https://github.com/BiniFn/WeebHub). The internal artifact and framework names retain upstream-compatible `seanime`/`SeanimeCore` identifiers until every native consumer is migrated together.

1. Clone WeebHub and build its web assets as required by the `mobile/` Go package.
2. Run `gomobile bind` from the WeebHub root for Android or iOS.
3. Put the generated Android AAR in `native-artifacts/android/seanime.aar`, or the generated iOS framework in `native-artifacts/ios/SeanimeCore.xcframework`.
4. Run `npx expo prebuild` and then `npx expo run:android` or `npx expo run:ios`.

## Attribution

- **WeebHub Mobile Server maintenance and branding:** BiniFn
- **Upstream mobile wrapper:** [Seanime Server Mobile](https://github.com/5rahim/seanime-server-mobile)
- **Upstream server:** [Seanime](https://github.com/5rahim/seanime) by 5rahim and contributors

Keep GPL-3.0 and applicable upstream copyright notices intact in every contribution.
