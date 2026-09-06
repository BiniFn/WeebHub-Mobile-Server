import { Button } from "@/components/button"
import { ProfileMenuItem, ProfileMenuSection, ProfileMenuToggle, RowDivider } from "@/components/profile-menu"
import { ServerControls } from "@/components/server-controls"
import { useServerController } from "@/hooks/use-server-controller"
import { checkForAppReleaseUpdateManually } from "@/lib/app-release-updates"
import { COLORS } from "@/lib/constants"
import { toast } from "@/lib/toast"
import { checkForOtaUpdateManually, getOtaVersionInfo } from "@/lib/updates"
import * as Linking from "expo-linking"
import { type Href, router, useFocusEffect } from "expo-router"
import {
    Activity,
    AlertTriangle,
    Battery,
    Bell,
    Chrome,
    Code,
    Download,
    ExternalLink,
    FileExclamationPoint,
    FolderCog,
    HouseWifi,
    Info,
    LogIn,
    LogOut,
    Power,
    Puzzle,
    RefreshCw,
    Rocket,
    Server,
    Settings,
    User,
    WifiOff,
} from "lucide-react-native"
import * as React from "react"
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    RefreshControl,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native"
import Animated, { FadeIn, FadeOut } from "react-native-reanimated"
import { useSafeAreaInsets } from "react-native-safe-area-context"

export default function HomeScreen() {
    const controller = useServerController()
    const insets = useSafeAreaInsets()

    const [isCheckingOtaUpdate, setIsCheckingOtaUpdate] = React.useState(false)
    const [isCheckingAppReleaseUpdate, setIsCheckingAppReleaseUpdate] = React.useState(false)
    const [isLoginModalOpen, setIsLoginModalOpen] = React.useState(false)
    const [anilistToken, setAnilistToken] = React.useState("")
    const [refreshing, setRefreshing] = React.useState(false)
    const otaVersionInfo = React.useMemo(() => getOtaVersionInfo(), [])

    useFocusEffect(React.useCallback(() => {
        controller.syncConfig()
    }, [controller.syncConfig]))

    const handleRefresh = React.useCallback(async () => {
        setRefreshing(true)
        try {
            await Promise.all([
                controller.refreshStatus(),
                controller.syncConfig(),
            ])
        }
        catch {
        }
        finally {
            setRefreshing(false)
        }
    }, [controller.refreshStatus, controller.syncConfig])

    const handleCheckForOtaUpdatePress = React.useCallback(() => {
        if (isCheckingOtaUpdate) {
            return
        }
        setIsCheckingOtaUpdate(true)
        checkForOtaUpdateManually().finally(() => {
            setIsCheckingOtaUpdate(false)
        })
    }, [isCheckingOtaUpdate])

    const handleCheckForAppReleaseUpdatePress = React.useCallback(() => {
        if (isCheckingAppReleaseUpdate) {
            return
        }
        setIsCheckingAppReleaseUpdate(true)
        checkForAppReleaseUpdateManually().finally(() => {
            setIsCheckingAppReleaseUpdate(false)
        })
    }, [isCheckingAppReleaseUpdate])

    const status = controller.nativeStatus
    const isRunning = Boolean(status?.isRunning || controller.reachability.reachable)
    const android = status?.android

    const handleStop = React.useCallback(() => {
        controller.stop()
    }, [controller.stop])

    const openSettings = React.useCallback(() => {
        if (status?.url) {
            const url = `${status.url.replace(/\/+$/, "")}/settings`
            Linking.openURL(url).catch(() => {
                toast.error("Failed to open WeebHub settings")
            })
        }
    }, [status?.url])

    const handleOpenTenji = React.useCallback(async () => {
        const url = "weebhub://"
        const fallbackUrl = "https://github.com/BiniFn/WeebHub-Tenji/releases"
        try {
            const canOpen = await Linking.canOpenURL(url).catch(() => false)
            if (canOpen) {
                await Linking.openURL(url)
            } else {
                try {
                    await Linking.openURL(url)
                }
                catch {
                    await Linking.openURL(fallbackUrl)
                }
            }
        }
        catch {
            Linking.openURL(fallbackUrl).catch(() => { })
        }
    }, [])

    return (
        <View className="flex-1 bg-background">
            <ScrollView
                className="flex-1"
                contentInsetAdjustmentBehavior="automatic"
                showsVerticalScrollIndicator={false}
                contentContainerClassName="px-5 pb-12 pt-6 gap-6"
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor={COLORS.brand}
                        colors={[COLORS.brand]}
                    />
                }
            >
                {controller.isOffline && (
                    <Animated.View
                        entering={FadeIn.duration(200)}
                        exiting={FadeOut.duration(200)}
                        className="bg-gray-600/70 rounded-xl"
                    >
                        <View className="flex-row items-center justify-center gap-2 px-4 py-1.5">
                            <WifiOff size={13} color="rgba(255,255,255,0.7)" />
                            <Text className="text-xs font-medium text-white/70">
                                Offline
                            </Text>
                        </View>
                    </Animated.View>
                )}
                <View className="flex-row items-center justify-between">
                    <View
                        accessible
                        accessibilityRole="header"
                        accessibilityLabel="WeebHub Mobile Server"
                        className="flex-row items-center gap-4"
                    >
                        <Image
                            source={require("../src/assets/images/tenji-icon.png")}
                            className="size-8"
                            resizeMode="contain"
                        />
                        <Text className="text-xl font-bold text-foreground">
                            WeebHub Mobile Server
                        </Text>
                    </View>

                    <View className="flex-row items-center gap-1.5 rounded-full border border-white/5 bg-gray-950/60 px-3 py-1.5">
                        <View
                            className={`h-2.5 w-2.5 rounded-full ${controller.reachability.reachable
                                ? "bg-green-400"
                                : isRunning
                                    ? "bg-amber-400 animate-pulse"
                                    : "bg-red-400"
                            }`}
                        />
                        <Text className="text-xs font-semibold text-white/70">
                            {controller.reachability.reachable
                                ? "Online"
                                : isRunning
                                    ? "Connecting"
                                    : "Stopped"}
                        </Text>
                    </View>
                </View>

                {isRunning && controller.reachability.reachable && !controller.reachability.hasSettings ? (
                    <View className="gap-3.5 rounded-2xl border border-brand-500/20 bg-brand-500/[0.04] p-5">
                        <View className="flex-row items-start gap-3">
                            <View className="h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10">
                                <FileExclamationPoint size={20} color={COLORS.brand} />
                            </View>
                            <View className="flex-1 gap-1">
                                <Text className="text-base font-semibold text-foreground">First-time setup required</Text>
                                <Text className="text-xs leading-5 text-muted-foreground">
                                    Your local WeebHub server is running but needs initial configuration.
                                </Text>
                            </View>
                        </View>

                        <Button
                            label="Complete Server Setup"
                            icon={Rocket}
                            variant="primary"
                            onPress={() => router.push("/getting-started")}
                        />
                    </View>
                ) : null}

                {Platform.OS === "android" && status !== null &&
                (!android?.notificationGranted ||
                    !android?.batteryOptimizationIgnored ||
                    !android?.manageExternalStorageGranted) ? (
                    <View className="gap-3.5 rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] p-5">
                        <View className="flex-row items-start gap-3">
                            <View className="h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
                                <AlertTriangle size={20} color={COLORS.warning} />
                            </View>
                            <View className="flex-1 gap-1">
                                <Text className="text-base font-semibold text-foreground">Background setup incomplete</Text>
                                <Text className="text-xs leading-5 text-muted-foreground">
                                    To prevent Android from killing the background service and ensure stable playback, configure these options:
                                </Text>
                                <View className="gap-1 mt-1">
                                    {!android?.notificationGranted ? (
                                        <Text className="text-xs text-muted-foreground/80">- Allow foreground notification</Text>
                                    ) : null}
                                    {!android?.batteryOptimizationIgnored ? (
                                        <Text className="text-xs text-muted-foreground/80">- Ignore battery optimization</Text>
                                    ) : null}
                                    {!android?.manageExternalStorageGranted ? (
                                        <Text className="text-xs text-muted-foreground/80">- Grant external storage permission</Text>
                                    ) : null}
                                </View>
                            </View>
                        </View>
                        <View className="flex-row gap-3">
                            {!android?.notificationGranted ? (
                                <Button
                                    className="flex-1"
                                    label="Notification"
                                    variant="secondary"
                                    onPress={controller.requestNotifications}
                                />
                            ) : null}
                            {!android?.batteryOptimizationIgnored ? (
                                <Button
                                    className="flex-1"
                                    label="Battery"
                                    variant="secondary"
                                    onPress={controller.openBatterySettings}
                                />
                            ) : null}
                            {!android?.manageExternalStorageGranted ? (
                                <Button
                                    className="flex-1"
                                    label="Storage"
                                    variant="secondary"
                                    onPress={controller.openStorageSettings}
                                />
                            ) : null}
                        </View>
                    </View>
                ) : null}

                {controller.reachability.reachable && controller.reachability.hasSettings ? (
                    <View className="flex-row items-center gap-3.5 rounded-2xl border border-white/5 bg-gray-950/40 p-4">
                        {controller.reachability.hasUser && controller.reachability.viewerAvatar ? (
                            <Image
                                source={{ uri: controller.reachability.viewerAvatar }}
                                className="h-12 w-12 rounded-full border border-white/10"
                                resizeMode="cover"
                            />
                        ) : (
                            <View className="h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5">
                                <User size={20} color="rgba(255, 255, 255, 0.4)" />
                            </View>
                        )}

                        <View className="flex-1">
                            <Text className="text-base font-semibold text-foreground">
                                {controller.reachability.hasUser ? (controller.reachability.viewerName ?? "WeebHub User") : "Local Account"}
                            </Text>
                            <Text className="text-xs text-muted-foreground mt-0.5">
                                {controller.reachability.hasUser ? "Logged in to AniList" : "Not logged in to AniList"}
                            </Text>
                        </View>

                        {controller.reachability.hasUser ? (
                            <TouchableOpacity
                                className="h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 border border-red-500/20 active:bg-red-500/20"
                                onPress={() => {
                                    Alert.alert(
                                        "Logout",
                                        "Are you sure you want to log out of AniList?",
                                        [
                                            { text: "Cancel", style: "cancel" },
                                            {
                                                text: "Logout",
                                                style: "destructive",
                                                onPress: controller.logoutFromAnilist,
                                            },
                                        ],
                                    )
                                }}
                            >
                                <LogOut size={16} color={COLORS.danger} />
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                className="flex-row items-center gap-1.5 rounded-xl px-2 py-2 active:opacity-90"
                                onPress={() => setIsLoginModalOpen(true)}
                            >
                                <LogIn size={14} color="#fff" strokeWidth={2.5} />
                                <Text className="text-xs font-bold text-white">Login with AniList</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                ) : null}

                <ServerControls
                    running={isRunning}
                    reachable={controller.reachability.reachable}
                    busy={controller.busy}
                    checking={controller.reachability.checking}
                    url={status?.url}
                    onPower={isRunning ? handleStop : controller.start}
                    onCopy={controller.copyUrl}
                    onSettings={openSettings}
                    onRefresh={() => controller.refreshStatus()}
                    onTenji={handleOpenTenji}
                />

                <ProfileMenuSection title="Configuration">
                    <ProfileMenuItem
                        icon={HouseWifi}
                        label="Remote Access"
                        detail={
                            controller.lanAccess.lan
                                ? controller.lanAccess.password
                                    ? "Remote access is enabled"
                                    : "A password is required while Remote Access is enabled"
                                : "Only this device can connect"
                        }
                        accessory={
                            <Text
                                className={`text-xs font-semibold ${
                                    controller.lanAccess.lan ? "text-green-300" : "text-muted-foreground"
                                }`}
                            >
                                {controller.lanAccess.lan ? "On" : "Off"}
                            </Text>
                        }
                        onPress={() => router.push("/lan-access" as Href)}
                    />
                    <RowDivider />
                    <ProfileMenuItem
                        icon={Code}
                        label="config.toml"
                        detail="Edit ports, binds, system pathways, and security"
                        onPress={() => router.push("/config-editor")}
                    />
                    <RowDivider />
                    <ProfileMenuItem
                        icon={Server}
                        label="Runtime Details"
                        detail="Uptime, data directories, and paths"
                        onPress={() => router.push("/runtime-info")}
                    />
                    {Platform.OS === "android" ? (
                        <>
                            <RowDivider />
                            <ProfileMenuItem
                                icon={FolderCog}
                                label="Data Directory"
                                detail="Copy or switch the server data folder"
                                onPress={() => router.push("/data-directory")}
                            />
                        </>
                    ) : null}
                    <RowDivider />
                    <ProfileMenuToggle
                        icon={WifiOff}
                        label="Offline Mode"
                        detail="Run the server without internet"
                        value={controller.isOffline}
                        onToggle={controller.toggleOffline}
                        disabled={controller.busy}
                    />
                </ProfileMenuSection>

                <ProfileMenuSection title="Extensions">
                    <ProfileMenuItem
                        icon={Puzzle}
                        label="Extension Marketplace"
                        detail="Browse, install, and manage extensions"
                        onPress={() => router.push("/extensions")}
                    />
                </ProfileMenuSection>

                <ProfileMenuSection title="Settings">
                    {Platform.OS === "android" ? (
                        <>
                            <ProfileMenuItem
                                icon={Bell}
                                label="Foreground Notification"
                                detail={
                                    android?.notificationGranted
                                        ? "Allowed"
                                        : "Required for Android foreground service visibility"
                                }
                                accessory={
                                    <Text
                                        className={`text-xs font-semibold ${android?.notificationGranted ? "text-green-300" : "text-amber-400"
                                        }`}
                                    >
                                        {android?.notificationGranted ? "Allowed" : "Configure"}
                                    </Text>
                                }
                                onPress={
                                    android?.notificationGranted
                                        ? controller.openSettings
                                        : controller.requestNotifications
                                }
                            />
                            <RowDivider />
                            <ProfileMenuItem
                                icon={Battery}
                                label="Battery Optimization"
                                detail={
                                    android?.batteryOptimizationIgnored
                                        ? "Ignored"
                                        : "Doze can pause torrent streams and background tasks"
                                }
                                accessory={
                                    <Text
                                        className={`text-xs font-semibold ${android?.batteryOptimizationIgnored ? "text-green-300" : "text-amber-400"
                                        }`}
                                    >
                                        {android?.batteryOptimizationIgnored ? "Ready" : "Configure"}
                                    </Text>
                                }
                                onPress={controller.openBatterySettings}
                            />
                            <RowDivider />
                            <ProfileMenuItem
                                icon={Info}
                                label="External Storage Permission"
                                detail={
                                    android?.manageExternalStorageGranted
                                        ? "Granted"
                                        : "Needed for downloading to public device storage"
                                }
                                accessory={
                                    <Text
                                        className={`text-xs font-semibold ${android?.manageExternalStorageGranted
                                            ? "text-green-300"
                                            : "text-amber-400"
                                        }`}
                                    >
                                        {android?.manageExternalStorageGranted ? "Ready" : "Configure"}
                                    </Text>
                                }
                                onPress={controller.openStorageSettings}
                            />
                            <RowDivider />
                            <ProfileMenuToggle
                                icon={Power}
                                label="Start on Boot"
                                detail="Launch foreground service when Android boots"
                                value={Boolean(status?.startOnBoot)}
                                onToggle={controller.toggleStartOnBoot}
                                disabled={controller.busy}
                            />
                        </>
                    ) : (
                        <>
                            <ProfileMenuItem
                                icon={Activity}
                                label="Background keep-alive"
                                detail={
                                    status?.keepAliveActive
                                        ? "Running"
                                        : "Inactive"
                                }
                                hideChevron
                            />
                            <RowDivider />
                            <ProfileMenuItem
                                icon={Settings}
                                label="System Settings"
                                detail="Adjust local network and background playback modes"
                                onPress={controller.openSettings}
                            />
                        </>
                    )}
                </ProfileMenuSection>

                <ProfileMenuSection title="App">
                    <ProfileMenuItem
                        icon={FileExclamationPoint}
                        label="Logs"
                        detail="Crash reports and diagnostics"
                        onPress={() => router.push("/logs" as never)}
                    />
                    {/*<ProfileMenuItem*/}
                    {/*    icon={Smartphone}*/}
                    {/*    label="App Version"*/}
                    {/*    detail={`v${otaVersionInfo.appVersion}`}*/}
                    {/*    hideChevron*/}
                    {/*/>*/}
                    <RowDivider />
                    <ProfileMenuItem
                        icon={Download}
                        label="Check App Update"
                        detail={isCheckingAppReleaseUpdate ? "Checking releases..." : undefined}
                        accessory={
                            isCheckingAppReleaseUpdate ? (
                                <ActivityIndicator size="small" color="rgba(255, 255, 255, 0.45)" />
                            ) : undefined
                        }
                        onPress={handleCheckForAppReleaseUpdatePress}
                        hideChevron
                    />
                    <RowDivider />
                    {/*<ProfileMenuItem*/}
                    {/*    icon={Info}*/}
                    {/*    label="OTA Version"*/}
                    {/*    detail={`${otaVersionInfo.otaVersion} · ${otaVersionInfo.detail}`}*/}
                    {/*    hideChevron*/}
                    {/*/>*/}
                    <RowDivider />
                    <ProfileMenuItem
                        icon={RefreshCw}
                        label="Check OTA Update"
                        detail={isCheckingOtaUpdate ? "Checking update server..." : undefined}
                        accessory={
                            isCheckingOtaUpdate ? (
                                <ActivityIndicator size="small" color="rgba(255, 255, 255, 0.45)" />
                            ) : undefined
                        }
                        onPress={handleCheckForOtaUpdatePress}
                        hideChevron
                    />
                </ProfileMenuSection>

                <View>
                    <Text className="text-sm text-muted-foreground text-right">
                        {`v${otaVersionInfo.appVersion}`} | {`${otaVersionInfo.otaVersion}`} | BiniFn
                    </Text>
                </View>
            </ScrollView>

            <Modal
                visible={isLoginModalOpen}
                animationType="fade"
                transparent
                onRequestClose={() => setIsLoginModalOpen(false)}
            >
                <KeyboardAvoidingView
                    className="flex-1 items-center justify-center bg-black/60 px-6"
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                >
                    <View className="w-full gap-5 rounded-2xl border border-white/5 bg-gray-950 p-6 shadow-2xl">
                        <View className="gap-1.5">
                            <Text className="text-xl font-bold text-foreground">Login with AniList</Text>
                            <Text className="text-xs text-muted-foreground leading-4">
                                Authorize WeebHub to sync with your account.
                            </Text>
                        </View>

                        <TouchableOpacity
                            className="flex-row items-center justify-center gap-2 rounded-xl bg-brand-500/10 border border-brand-500/25 py-3.5 active:bg-brand-500/20"
                            onPress={() => {
                                Linking.openURL("https://anilist.co/api/v2/oauth/authorize?client_id=13985&response_type=token").catch(() => { })
                            }}
                        >
                            <Chrome size={18} color={COLORS.brand} />
                            <Text className="text-sm font-semibold text-brand-400">Open AniList in Browser</Text>
                            <ExternalLink size={16} color={COLORS.brand} />
                        </TouchableOpacity>

                        <View className="gap-2">
                            <Text className="text-xs font-semibold text-muted-foreground">Paste Access Token</Text>
                            <TextInput
                                className="rounded-xl border border-border bg-black/40 px-3.5 py-3.5 text-sm leading-5"
                                style={{ color: "#ffffff" }}
                                autoCapitalize="none"
                                autoCorrect={false}
                                spellCheck={false}
                                value={anilistToken}
                                onChangeText={setAnilistToken}
                                placeholder="eyJhbGciOiJSUzI1Ni..."
                                placeholderTextColor="rgba(255,255,255,0.4)"
                                selectionColor={COLORS.brand}
                                cursorColor={COLORS.brand}
                            />
                        </View>

                        <View className="flex-row gap-3 mt-1">
                            <Button
                                className="flex-1"
                                label="Cancel"
                                variant="secondary"
                                onPress={() => {
                                    setIsLoginModalOpen(false)
                                    setAnilistToken("")
                                }}
                            />
                            <Button
                                className="flex-1"
                                label="Login"
                                variant="primary"
                                disabled={!anilistToken.trim() || controller.busy}
                                loading={controller.busy}
                                onPress={async () => {
                                    await controller.loginToAnilist(anilistToken.trim())
                                    setIsLoginModalOpen(false)
                                    setAnilistToken("")
                                }}
                            />
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    )
}
