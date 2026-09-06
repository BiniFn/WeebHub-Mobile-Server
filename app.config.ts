import { ConfigContext, ExpoConfig } from "expo/config"

export default ({ config }: ConfigContext): ExpoConfig => {
    const updatesUrl = process.env.EXPO_UPDATES_URL

    return {
        ...config,
        name: "WeebHub Mobile Server",
        slug: "weebhub-mobile-server",
        version: "0.3.3",
        orientation: "portrait",
        icon: "./src/assets/images/icon.png",
        scheme: "weebhub-server",
        userInterfaceStyle: "dark",
        jsEngine: "hermes",
        runtimeVersion: {
            policy: "appVersion",
        },
        updates: updatesUrl ? {
            enabled: true,
            url: updatesUrl,
            checkAutomatically: "NEVER",
            fallbackToCacheTimeout: 0,
            requestHeaders: {
                "expo-channel-name": "stable",
            },
        } : {
            enabled: false,
        },
        ios: {
            buildNumber: "6",
            appleTeamId: process.env.EXPO_APPLE_TEAM_ID || "",
            supportsTablet: true,
            bundleIdentifier: process.env.EXPO_IOS_BUNDLE_ID || "app.weebhub.mobile-server",
            infoPlist: {
                NSLocalNetworkUsageDescription: "WeebHub Mobile Server accepts local connections from WeebHub clients on this device.",
                NSAppTransportSecurity: {
                    NSAllowsLocalNetworking: true,
                },
                UIBackgroundModes: ["audio"],
                UIFileSharingEnabled: true,
                LSSupportsOpeningDocumentsInPlace: true,
                LSApplicationQueriesSchemes: ["weebhub"],
            },
        },
        android: {
            allowBackup: false,
            jsEngine: "hermes",
            package: process.env.EXPO_ANDROID_PACKAGE || "app.weebhub.mobile-server",
            versionCode: 6,
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
    }
}
