import { ConfigContext, ExpoConfig } from "expo/config"

export default ({ config }: ConfigContext): ExpoConfig => ({
    ...config,
    name: "Seanime Server",
    slug: "seanime-mobile-server",
    version: "0.3.1",
    orientation: "portrait",
    icon: "./src/assets/images/icon.png",
    scheme: "seanime-server",
    userInterfaceStyle: "dark",
    jsEngine: "hermes",
    runtimeVersion: {
        policy: "appVersion",
    },
    updates: {
        enabled: true,
        url: "https://seanime.app/api/ota/server/manifest",
        checkAutomatically: "NEVER",
        fallbackToCacheTimeout: 0,
        requestHeaders: {
            "expo-channel-name": "stable",
        },
    },
    ios: {
        buildNumber: "5",
        appleTeamId: process.env.EXPO_APPLE_TEAM_ID || "",
        supportsTablet: true,
        bundleIdentifier: "app.seanime.server",
        infoPlist: {
            NSLocalNetworkUsageDescription: "Seanime Server accepts local connections from Seanime clients on this device.",
            NSAppTransportSecurity: {
                NSAllowsLocalNetworking: true,
            },
            UIBackgroundModes: ["audio"],
            UIFileSharingEnabled: true,
            LSSupportsOpeningDocumentsInPlace: true,
            LSApplicationQueriesSchemes: ["seanime"],
        },
    },
    android: {
        allowBackup: false,
        jsEngine: "hermes",
        package: "app.seanime.server",
        versionCode: 5,
        adaptiveIcon: {
            foregroundImage: "./src/assets/images/adaptive-icon.png",
            backgroundColor: "#0c0c0c",
        },
        permissions: [
            "android.permission.INTERNET",
            "android.permission.ACCESS_NETWORK_STATE",
            "android.permission.FOREGROUND_SERVICE",
            "android.permission.FOREGROUND_SERVICE_DATA_SYNC",
            "android.permission.WAKE_LOCK",
            "android.permission.RECEIVE_BOOT_COMPLETED",
            "android.permission.POST_NOTIFICATIONS",
            "android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS",
            "android.permission.READ_EXTERNAL_STORAGE",
            "android.permission.WRITE_EXTERNAL_STORAGE",
            "android.permission.MANAGE_EXTERNAL_STORAGE",
        ],
    },
    plugins: [
        "expo-router",
        [
            "expo-splash-screen",
            {
                image: "./src/assets/images/splash-logo.png",
                resizeMode: "contain",
                backgroundColor: "#070707",
                android: {
                    imageWidth: 200,
                    resizeMode: "contain",
                },
                ios: {
                    imageWidth: 100,
                },
            },
        ],
        "./plugins/withSeanimeServerNative.js",
        "expo-updates",
    ],
    experiments: {
        typedRoutes: true,
        reactCompiler: true,
    },
})
