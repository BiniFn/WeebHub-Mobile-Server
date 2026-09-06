const { withAndroidManifest, withDangerousMod, withInfoPlist } = require("expo/config-plugins")
const fs = require("node:fs")
const path = require("node:path")

function checkPerm(manifest, name, attrs = {}) {
    const permissions = manifest["uses-permission"] ?? []
    const existing = permissions.find(permission => permission.$["android:name"] === name)

    if (existing) {
        existing.$ = { ...existing.$, ...attrs }
        manifest["uses-permission"] = permissions
        return
    }

    permissions.push({
        $: {
            "android:name": name,
            ...attrs,
        },
    })
    manifest["uses-permission"] = permissions
}

function assertFile(projectRoot, relativePath) {
    const filePath = path.join(projectRoot, relativePath)
    if (!fs.existsSync(filePath)) {
        throw new Error(`Missing WeebHub mobile artifact: ${relativePath}`)
    }
    return filePath
}

function copyFile(projectRoot, sourceRelativePath, destRelPath) {
    const sourcePath = assertFile(projectRoot, sourceRelativePath)
    const destinationPath = path.join(projectRoot, destRelPath)
    fs.mkdirSync(path.dirname(destinationPath), { recursive: true })
    fs.copyFileSync(sourcePath, destinationPath)
}

function copyDir(projectRoot, sourceRelativePath, destRelPath) {
    const sourcePath = assertFile(projectRoot, sourceRelativePath)
    const destinationPath = path.join(projectRoot, destRelPath)
    fs.rmSync(destinationPath, { recursive: true, force: true })
    fs.mkdirSync(path.dirname(destinationPath), { recursive: true })
    fs.cpSync(sourcePath, destinationPath, { recursive: true })
}

const withSeanimeServerNative = config => {
    config = withInfoPlist(config, plistConfig => {
        const plist = plistConfig.modResults
        const currentModes = Array.isArray(plist.UIBackgroundModes) ? plist.UIBackgroundModes : []
        plist.UIBackgroundModes = Array.from(new Set([...currentModes, "audio"]))
        plist.NSLocalNetworkUsageDescription =
            plist.NSLocalNetworkUsageDescription ??
            "WeebHub Mobile Server accepts local connections from WeebHub clients on this device."
        return plistConfig
    })

    config = withAndroidManifest(config, manifestConfig => {
        const manifest = manifestConfig.modResults.manifest
        manifest.$ = {
            ...manifest.$,
            "xmlns:tools": manifest.$?.["xmlns:tools"] ?? "http://schemas.android.com/tools",
        }

        checkPerm(manifest, "android.permission.INTERNET")
        checkPerm(manifest, "android.permission.ACCESS_NETWORK_STATE")
        checkPerm(manifest, "android.permission.FOREGROUND_SERVICE")
        checkPerm(manifest, "android.permission.FOREGROUND_SERVICE_DATA_SYNC")
        checkPerm(manifest, "android.permission.WAKE_LOCK")
        checkPerm(manifest, "android.permission.RECEIVE_BOOT_COMPLETED")
        checkPerm(manifest, "android.permission.POST_NOTIFICATIONS")
        checkPerm(manifest, "android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS")
        checkPerm(manifest, "android.permission.READ_EXTERNAL_STORAGE", { "android:maxSdkVersion": "32" })
        checkPerm(manifest, "android.permission.WRITE_EXTERNAL_STORAGE", { "android:maxSdkVersion": "28" })
        checkPerm(manifest, "android.permission.MANAGE_EXTERNAL_STORAGE")

        const application = manifest.application?.[0]
        if (application) {
            application.$ = {
                ...application.$,
                "android:usesCleartextTraffic": "true",
                "android:largeHeap": "true",
                "android:requestLegacyExternalStorage": "true",
                "android:allowBackup": "false",
            }
        }

        return manifestConfig
    })

    config = withDangerousMod(config, [
        "android",
        modConfig => {
            copyFile(
                modConfig.modRequest.projectRoot,
                "native-artifacts/android/seanime.aar",
                "android/app/libs/seanime.aar",
            )

            const sourcesJar = path.join(modConfig.modRequest.projectRoot, "native-artifacts/android/seanime-sources.jar")
            if (fs.existsSync(sourcesJar)) {
                copyFile(
                    modConfig.modRequest.projectRoot,
                    "native-artifacts/android/seanime-sources.jar",
                    "android/app/libs/seanime-sources.jar",
                )
            }

            return modConfig
        },
    ])

    config = withDangerousMod(config, [
        "ios",
        modConfig => {
            copyDir(
                modConfig.modRequest.projectRoot,
                "native-artifacts/ios/SeanimeCore.xcframework",
                "ios/SeanimeCore.xcframework",
            )
            return modConfig
        },
    ])

    return config
}

module.exports = withSeanimeServerNative
