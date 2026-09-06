import { Button } from "@/components/button"
import { useServerController } from "@/hooks/use-server-controller"
import { COLORS } from "@/lib/constants"
import { router } from "expo-router"
import { ArrowLeftRight, ChevronLeft, Database, FolderInput, HardDrive, RotateCcw, ShieldAlert } from "lucide-react-native"
import * as React from "react"
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native"

export default function DataDirectoryScreen() {
    const controller = useServerController()
    const status = controller.nativeStatus
    const [path, setPath] = React.useState("")
    const pathReady = React.useRef(false)

    React.useEffect(() => {
        if (!status || pathReady.current) return
        pathReady.current = true
        setPath(status.usingCustomDataDir
            ? status.dataDir
            : status.suggestedDataDir ?? status.dataDir)
    }, [status])

    const target = path.trim()
    const isRunning = Boolean(status?.isRunning || controller.reachability.reachable)
    const isCurrent = Boolean(status && target === status.dataDir)
    const validPath = target.startsWith("/")
    const canChange = Boolean(status && validPath && !isCurrent && !isRunning && !controller.busy)

    const copyAndUse = React.useCallback(() => {
        if (!canChange) return

        Alert.alert(
            "Copy server data?",
            `Everything in the current data directory will be copied to:\n\n${target}\n\nThe original files will be kept as a backup. The destination must be empty.`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Copy and Use",
                    onPress: () => {
                        void controller.setDir(target, true)
                    },
                },
            ],
        )
    }, [canChange, controller.setDir, target])

    const useExisting = React.useCallback(() => {
        if (!canChange) return

        Alert.alert(
            "Switch to this folder?",
            `Seanime will load its config and database from:\n\n${target}\n\nNothing will be copied or deleted. Only continue if this folder already contains Seanime data, including config.toml.`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Switch Folder",
                    onPress: () => {
                        void controller.setDir(target, false)
                    },
                },
            ],
        )
    }, [canChange, controller.setDir, target])

    const useInternal = React.useCallback(() => {
        if (!status?.usingCustomDataDir || isRunning || controller.busy) return

        Alert.alert(
            "Use internal data?",
            "Seanime will switch back to its original private folder. No files from the current folder will be copied back.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Use Internal Folder",
                    onPress: () => {
                        void controller.setDir(status.internalDataDir, false)
                    },
                },
            ],
        )
    }, [controller.busy, controller.setDir, isRunning, status])

    return (
        <ScrollView
            className="flex-1 bg-background"
            contentContainerClassName="gap-6 px-6 pb-12 pt-6"
            contentInsetAdjustmentBehavior="automatic"
            keyboardShouldPersistTaps="handled"
        >
            <View className="flex-row items-center gap-3">
                <Pressable
                    className="rounded-full p-1 active:bg-white/10"
                    hitSlop={12}
                    onPress={() => router.back()}
                >
                    <ChevronLeft size={24} color={COLORS.foreground} />
                </Pressable>
                <View>
                    <Text className="text-2xl font-bold text-foreground">Data Directory</Text>
                    <Text className="mt-0.5 text-xs text-muted-foreground">Android server storage</Text>
                </View>
            </View>

            <View className="gap-3 rounded-2xl border border-white/5 bg-white/3 p-5">
                <View className="flex-row items-center justify-between gap-4">
                    <View className="flex-row items-center gap-2.5">
                        <Database size={18} color={COLORS.brand} />
                        <Text className="text-sm font-semibold text-foreground">Current folder</Text>
                    </View>
                    <View className="rounded-full bg-white/5 px-2.5 py-1">
                        <Text className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                            {status?.usingCustomDataDir ? "Custom" : "Internal"}
                        </Text>
                    </View>
                </View>
                <Text selectable className="text-sm leading-5 text-foreground">
                    {status?.dataDir ?? "Loading..."}
                </Text>
            </View>

            {isRunning ? (
                <View className="flex-row gap-3 rounded-xl border border-amber-400/20 bg-amber-400/10 p-4">
                    <HardDrive size={19} color={COLORS.warning} />
                    <View className="shrink gap-1">
                        <Text className="text-sm font-semibold text-amber-300">Stop the server first</Text>
                        <Text className="text-xs leading-5 text-amber-100/70">
                            Stopping closes the app. Reopen it, then return here to change the folder safely.
                        </Text>
                    </View>
                </View>
            ) : null}

            {status?.android && !status.android.manageExternalStorageGranted ? (
                <View className="gap-3 rounded-xl border border-brand-400/20 bg-brand-500/10 p-4">
                    <View className="flex-row gap-3">
                        <FolderInput size={19} color={COLORS.brand} />
                        <View className="shrink gap-1">
                            <Text className="text-sm font-semibold text-foreground">Storage permission required</Text>
                            <Text className="text-xs leading-5 text-muted-foreground">
                                Android must allow Seanime Server to manage files before it can use a public folder.
                            </Text>
                        </View>
                    </View>
                    <Button
                        label="Open Storage Permission"
                        variant="secondary"
                        onPress={controller.openStorageSettings}
                    />
                </View>
            ) : null}

            <View className="gap-3">
                <View className="flex-row items-center justify-between gap-3 px-1">
                    <Text className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
                        New folder
                    </Text>
                    {status?.suggestedDataDir ? (
                        <Pressable
                            className="rounded-lg px-2 py-1 active:bg-white/10"
                            onPress={() => setPath(status.suggestedDataDir ?? "")}
                        >
                            <Text className="text-xs font-semibold text-brand-400">Use suggested</Text>
                        </Pressable>
                    ) : null}
                </View>
                <TextInput
                    className="min-h-14 rounded-xl border border-border bg-gray-950/60 px-4 py-3 text-sm text-foreground focus:border-brand-500"
                    value={path}
                    onChangeText={setPath}
                    placeholder="/storage/emulated/0/Seanime"
                    placeholderTextColorClassName="accent-muted-foreground"
                    cursorColorClassName="accent-brand-400"
                    selectionColorClassName="accent-brand-500"
                    autoCapitalize="none"
                    autoCorrect={false}
                    spellCheck={false}
                />
                {!validPath && target ? (
                    <Text className="px-1 text-xs text-destructive">Enter an absolute path starting with /.</Text>
                ) : isCurrent ? (
                    <Text className="px-1 text-xs text-muted-foreground">This is already the current folder.</Text>
                ) : (
                    <Text className="px-1 text-xs leading-5 text-muted-foreground">
                        The suggested path is visible to file managers and over USB.
                    </Text>
                )}
            </View>

            <View className="gap-3">
                <View className="gap-2">
                    <Button
                        label="Copy and use folder"
                        icon={FolderInput}
                        variant="primary"
                        loading={controller.busy}
                        disabled={!canChange}
                        onPress={copyAndUse}
                    />
                    <Text className="px-1 text-xs leading-5 text-muted-foreground">
                        Copies your current data to this folder, then switches to it.
                    </Text>
                </View>
                <View className="gap-2">
                    <Button
                        label="Switch to folder"
                        icon={ArrowLeftRight}
                        variant="secondary"
                        disabled={!canChange}
                        onPress={useExisting}
                    />
                    <Text className="px-1 text-xs leading-5 text-muted-foreground">
                        Switches to data already stored here. Nothing is copied or deleted.
                    </Text>
                </View>
                {status?.usingCustomDataDir ? (
                    <Button
                        label="Use internal folder"
                        icon={RotateCcw}
                        variant="ghost"
                        disabled={isRunning || controller.busy}
                        onPress={useInternal}
                    />
                ) : null}
            </View>

            <View className="flex-row gap-3 rounded-xl border border-white/5 bg-gray-950/40 p-4">
                <ShieldAlert size={19} color={COLORS.muted} />
                <View className="shrink gap-1">
                    <Text className="text-sm font-semibold text-foreground">Public folders are less private</Text>
                    <Text className="text-xs leading-5 text-muted-foreground">
                        Seanime data can include account tokens, settings, logs, and extensions. Other apps with broad storage access may be able to
                        read them.
                    </Text>
                </View>
            </View>
        </ScrollView>
    )
}
