# Seanime Server Contribution Guide

Contributions to Seanime Server are welcome. This guide outlines how to set up the repository for local development, run the application, and submit code changes.

---

## Local setup

### System prerequisites

To build and run Seanime Server, ensure your machine has the following tools installed:

* **Node.js** (22+)
* **npm**
* **Go** (v1.26+)
* **gomobile**
* **JDK**
* **Android Studio & Android SDK**
* **Xcode**

### Guide

1. Clone the codebase:
   ```bash
   git clone https://github.com/5rahim/seanime-server-mobile.git
   cd seanime-server-mobile
   ```
2. Install npm packages:
   ```bash
   npm install
   ```

---

## Development workflow

Seanime Server is built using Expo and React Native, embedding the Seanime Go server as a native background library.

### Compile Go server

Check out the [Seanime repository](https://github.com/5rahim/seanime). To build the Go mobile libraries, follow these steps:

#### 1. Build & Prepare web assets

Build the web interface from the main Seanime repository first:

```bash
cd /path/to/seanime/seanime-web
npm install
npm run build

# copy build outputs to the server's web package
rm -rf ../web
cp -R out ../web

# copy web files to the mobile package subdirectory
rm -rf ../mobile/web
cp -R ../web ../mobile/web
```

#### 2. Build android library (aar)

```bash
cd /path/to/seanime
gomobile bind -ldflags "-s -w -checklinkname=0 -linkmode=external -extldflags=-Wl,-z,max-page-size=16384,-z,common-page-size=16384" -target=android/arm64,android/arm,android/amd64 -androidapi 21 -o seanime.aar ./mobile

# copy to this repository
cp seanime.aar /path/to/seanime-server-mobile/native-artifacts/android/seanime.aar
# copy sources if available
cp seanime-sources.jar /path/to/seanime-server-mobile/native-artifacts/android/seanime-sources.jar
```

#### 3. Build ios library (xcframework)

Requires macOS.

```bash
cd /path/to/seanime
gomobile bind -ldflags "-s -w -checklinkname=0" -target=ios -o SeanimeCore.xcframework ./mobile

# copy to this repository
rm -rf /path/to/seanime-server-mobile/native-artifacts/ios/SeanimeCore.xcframework
cp -R SeanimeCore.xcframework /path/to/seanime-server-mobile/native-artifacts/ios/SeanimeCore.xcframework
```

#### 4. Cleanup

```bash
cd /path/to/seanime
rm -rf mobile/web
mkdir -p mobile/web
touch mobile/web/.gitkeep
```

### Starting Metro

```bash
npm run dev:start
```

### Developing on Android

```bash
npx expo run:android
```

### Developing on iOS

```bash
npm run dev:ios
```

---

## Code Quality Standards

Before submitting a Pull Request, verify that your code conforms to these standards:

1. **TypeScript Strictness**: Write strictly typed code. Avoid using `any` and verify type definitions. Validate your changes pass TypeScript compilation:
   ```bash
   npx tsc --noEmit
   ```
2. **Styling and Layout**: We use Tailwind CSS v4 and `uniwind` for universal styling. Please leverage the existing layout utility tokens and spacing variables to maintain visual consistency.
3. **Cross-Platform Verification**: Verify that your interface looks correct and functions properly on both iOS and Android.

---

## Pull Request Submission

### Submission Checklist

1. Create a focused feature branch from the latest default branch.
2. Ensure your changes address a single feature or bug fix to simplify review.
3. Verify that the TypeScript compilation passes successfully.
4. Provide a clear description of the modification in the Pull Request, attaching screenshots or screen recordings for UI-related changes.

### AI Usage Guidelines

> [!IMPORTANT]
> If you used generative AI tools (such as Claude, ChatGPT, Cursor, or similar services) to assist in writing, refactoring, or documenting your code contribution, you must disclose this usage in your
> Pull Request description.

Please state:

* Which AI tools were utilized.
* The specific scope of their assistance (e.g., "AI assisted with writing TypeScript definitions", "Used Claude to generate helper utility functions", or "Used Cursor to help build the UI layout").

All contributors are fully responsible for the correctness, stability, and security of their submitted code, regardless of whether AI tools were used. All code must be validated and tested before
submission.
