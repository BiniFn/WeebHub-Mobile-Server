import { Button } from "@/components/button"
import { ProfileMenuItem, ProfileMenuSection, ProfileMenuToggle, RowDivider } from "@/components/profile-menu"
import {
    clearOfflineLogs,
    copyOfflineLogTextToClipboard,
    getOfflineCrashText,
    getOfflineLogEntries,
    getOfflineLogText,
    isOfflineLoggingEnabled,
    setOfflineLoggingEnabled,
} from "@/lib/offline-logger"
import { toast } from "@/lib/toast"
import { router } from "expo-router"
import { ChevronLeft, Clipboard, FileExclamationPoint, Trash2 } from "lucide-react-native"
import * as React from "react"
import { Alert, ScrollView, Share, Text, TouchableOpacity, View } from "react-native"

type LogSummary = {
    entries: number
    crashes: number
}

function readLogSummary(): LogSummary {
    const entries = getOfflineLogEntries()

    return {
        entries: entries.length,
        crashes: entries.filter(entry => entry.level === "fatal" || entry.scope.includes("crash")).length,
    }
}

function formatSummary(summary: LogSummary) {
    if (summary.entries === 0) return "No local logs saved"

    const entryLabel = summary.entries === 1 ? "1 entry" : `${summary.entries} entries`
    const crashLabel = summary.crashes === 0
        ? null
        : summary.crashes === 1 ? "1 crash" : `${summary.crashes} crashes`

    return crashLabel ? `${entryLabel} · ${crashLabel}` : entryLabel
}

function formatCrashSummary(crashes: number) {
    if (crashes === 0) return "No crash records saved"
    return crashes === 1 ? "1 crash record" : `${crashes} crash records`
}

export default function LogsScreen() {
    const [loggingEnabled, setLoggingEnabledState] = React.useState(isOfflineLoggingEnabled)
    const [summary, setSummary] = React.useState(readLogSummary)
    const [copyingKind, setCopyingKind] = React.useState<"crash" | "logs" | null>(null)

    const refreshSummary = React.useCallback(() => {
        setLoggingEnabledState(isOfflineLoggingEnabled())
        setSummary(readLogSummary())
    }, [])

    React.useEffect(() => {
        refreshSummary()
    }, [refreshSummary])

    const handleToggleLogging = React.useCallback((enabled: boolean) => {
        setOfflineLoggingEnabled(enabled)
        refreshSummary()
        toast.info(enabled ? "Logging enabled" : "Logging disabled")
    }, [refreshSummary])

    const copyText = React.useCallback((kind: "crash" | "logs") => {
        if (copyingKind) return

        void (async () => {
            setCopyingKind(kind)
            try {
                const text = kind === "crash" ? await getOfflineCrashText() : await getOfflineLogText()
                if (!text.trim()) {
                    toast.info(kind === "crash" ? "No crash records yet" : "No diagnostic logs yet")
                    return
                }

                const copied = copyOfflineLogTextToClipboard(text)
                if (copied) {
                    toast.success(kind === "crash" ? "Crash report copied" : "Logs copied")
                    return
                }

                await Share.share({ message: text })
                toast.success(kind === "crash" ? "Crash report ready to share" : "Logs ready to share")
            }
            catch {
                toast.error(kind === "crash" ? "Failed to copy crash report" : "Failed to copy logs")
            }
            finally {
                setCopyingKind(null)
                refreshSummary()
            }
        })()
    }, [copyingKind, refreshSummary])

    const handleClearLogs = React.useCallback(() => {
        Alert.alert(
            "Clear local logs?",
            "Crash records and diagnostic logs stored on this device will be removed.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Clear",
                    style: "destructive",
                    onPress: () => {
                        clearOfflineLogs()
                        refreshSummary()
                        toast.success("Logs cleared")
                    },
                },
            ],
        )
    }, [refreshSummary])

    return (
        <ScrollView
            className="flex-1 bg-background"
            contentContainerClassName="px-6 pb-12 pt-6 gap-6"
        >
            <View className="flex-row items-center gap-3">
                <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
                    <ChevronLeft size={24} color="white" />
                </TouchableOpacity>
                <View>
                    <Text className="text-2xl font-bold text-foreground">Logs</Text>
                    <Text className="text-xs text-muted-foreground mt-0.5">Crash records and diagnostics</Text>
                </View>
            </View>

            <View className="gap-4">
                <ProfileMenuSection title="Capture">
                    <ProfileMenuToggle
                        icon={FileExclamationPoint}
                        label="Enable Logging"
                        detail="Temporarily save console logs on this device"
                        value={loggingEnabled}
                        onToggle={handleToggleLogging}
                    />
                </ProfileMenuSection>

                <ProfileMenuSection title="Local Logs">
                    <ProfileMenuItem
                        icon={FileExclamationPoint}
                        label={copyingKind === "crash" ? "Preparing Crash Report" : "Copy Crash Report"}
                        detail={formatCrashSummary(summary.crashes)}
                        onPress={() => copyText("crash")}
                        hideChevron
                    />
                    <RowDivider />
                    <ProfileMenuItem
                        icon={Clipboard}
                        label={copyingKind === "logs" ? "Preparing Logs" : "Copy Diagnostic Logs"}
                        detail={formatSummary(summary)}
                        onPress={() => copyText("logs")}
                        hideChevron
                    />
                    <RowDivider />
                    <ProfileMenuItem
                        icon={Trash2}
                        label="Clear Logs"
                        detail="Remove logs stored on this device"
                        onPress={handleClearLogs}
                        hideChevron
                    />
                </ProfileMenuSection>

                <View className="">
                    <Text className="text-xs leading-5 text-muted-foreground">
                        Crash records are saved automatically. Continuous console logging is off unless enabled here.
                    </Text>
                </View>
            </View>
        </ScrollView>
    )
}
