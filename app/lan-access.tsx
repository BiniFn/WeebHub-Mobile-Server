import { Button } from "@/components/button"
import { useLanAddress } from "@/hooks/use-lan-address"
import { useServerController } from "@/hooks/use-server-controller"
import { COLORS } from "@/lib/constants"
import { LAN_HOST, LOOPBACK_HOST } from "@/lib/server-access"
import { toast } from "@/lib/toast"
import { copyToClipboard } from "@modules/seanime-server"
import { router } from "expo-router"
import { ChevronLeft, Copy, Eye, EyeOff, HouseWifi, LockKeyhole, Save } from "lucide-react-native"
import * as React from "react"
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native"

export default function LanAccessScreen() {
    const controller = useServerController()
    const address = useLanAddress()
    const [ready, setReady] = React.useState(false)
    const [lan, setLan] = React.useState(false)
    const [password, setPassword] = React.useState("")
    const [showPassword, setShowPassword] = React.useState(false)

    React.useEffect(() => {
        if (!ready && controller.config) {
            setLan(controller.lanAccess.lan)
            setPassword(controller.lanAccess.password)
            setReady(true)
        }
    }, [controller.config, controller.lanAccess, ready]);

    const needsPassword = lan && !password.trim()
    const dirty =
        ready &&
        (lan !== controller.lanAccess.lan ||
            password !== controller.lanAccess.password)
    const canSave = dirty && !needsPassword && !controller.busy
    const host = lan ? LAN_HOST : LOOPBACK_HOST

    const handleSave = React.useCallback(() => {
        const cleanPassword = password.trim()
        setPassword(cleanPassword)
        controller.saveLan(lan, cleanPassword)
    }, [controller.saveLan, lan, password]);

    const handleCopy = React.useCallback(() => {
        if (!address.url) return

        try {
            if (!copyToClipboard(address.url)) {
                toast.error("Could not copy the remote URL")
                return
            }
            toast.success("Remote URL copied")
        }
        catch {
            toast.error("Could not copy the remote URL")
        }
    }, [address.url])

    return (
        <KeyboardAvoidingView
            className="flex-1 bg-background"
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            <ScrollView
                className="flex-1"
                contentInsetAdjustmentBehavior="automatic"
                contentContainerClassName="px-6 pb-12 pt-6 gap-6"
                keyboardShouldPersistTaps="handled"
            >
                <View className="flex-row items-center gap-3">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        hitSlop={12}
                    >
                        <ChevronLeft size={24} color="white" />
                    </TouchableOpacity>
                    <View className="flex-1">
                        <Text className="text-2xl font-bold text-foreground">
                            Remote Access
                        </Text>
                        <Text className="mt-0.5 text-xs text-muted-foreground">
                            Connect from other devices on your network
                        </Text>
                    </View>
                </View>

                <View className="gap-4 rounded-xl border border-transparent bg-white/3 p-5">
                    <View className="flex-row items-center gap-3.5">
                        <HouseWifi size={21} color="rgba(255, 255, 255, 0.45)" />
                        <View className="flex-1 gap-1">
                            <Text className="text-base font-semibold text-foreground">
                                Enable Remote Access
                            </Text>
                        </View>
                        <Switch
                            accessibilityLabel="Allow remote connections"
                            value={lan}
                            onValueChange={setLan}
                            disabled={!ready || controller.busy}
                            trackColor={{
                                false: "rgba(255,255,255,0.08)",
                                true: COLORS.brand,
                            }}
                            thumbColor="#ffffff"
                        />
                    </View>

                    {/*<View className="h-px bg-white/5" />

                    <View className="flex-row items-center justify-between">
                     <Text className="text-xs font-medium text-muted-foreground">
                     Bind address
                     </Text>
                     <Text
                     selectable
                     className="font-mono text-sm font-semibold text-foreground"
                     >
                            {host}
                        </Text>
                     </View>*/}
                </View>

                {lan ? (
                    <View className="gap-3 rounded-xl border border-white/5 bg-gray-950/60 p-5">
                        <View className="flex-row items-center justify-between gap-4">
                            <View className="flex-1 gap-1">
                                <Text className="text-xs font-medium text-muted-foreground">
                                    Private IP address
                                </Text>
                                {address.loading ? (
                                    <View className="h-7 flex-row items-center gap-2">
                                        <ActivityIndicator
                                            size="small"
                                            color={COLORS.muted}
                                        />
                                        <Text className="text-sm text-muted-foreground">
                                            Finding this device on the network…
                                        </Text>
                                    </View>
                                ) : address.ip ? (
                                    <Text
                                        selectable
                                        className="font-mono text-lg font-semibold text-foreground"
                                    >
                                        {address.ip}
                                    </Text>
                                ) : (
                                    <Text className="text-sm leading-5 text-muted-foreground">
                                        {address.message}
                                    </Text>
                                )}
                            </View>
                            {address.url ? (
                                <Pressable
                                    accessibilityLabel="Copy remote URL"
                                    className="h-11 w-11 items-center justify-center rounded-xl bg-white/5 active:bg-white/10"
                                    onPress={handleCopy}
                                    hitSlop={8}
                                >
                                    <Copy size={18} color={COLORS.muted} />
                                </Pressable>
                            ) : null}
                        </View>

                        {address.url ? (
                            <View className="gap-1 border-t border-white/5 pt-3">
                                <Text className="text-xs font-medium text-muted-foreground">
                                    Remote URL
                                </Text>
                                <Text
                                    selectable
                                    className="font-mono text-sm font-semibold text-foreground"
                                >
                                    {address.url}
                                </Text>
                                <Text className="text-xs leading-5 text-muted-foreground">
                                    Use this URL to connect to this server.
                                </Text>
                            </View>
                        ) : null}
                    </View>
                ) : null}

                <View className="gap-2.5">
                    <View className="flex-row items-center gap-1 px-1">
                        <Text className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
                            Server password
                        </Text>
                        {lan ? (
                            <Text className="text-xs font-semibold text-red-400">
                                *
                            </Text>
                        ) : null}
                    </View>
                    <View
                        className={`h-14 flex-row items-center rounded-xl border bg-black/40 px-4 ${
                            needsPassword
                                ? "border-red-500/60"
                                : "border-white/5"
                        }`}
                    >
                        <LockKeyhole size={18} color="rgba(255,255,255,0.4)" />
                        <TextInput
                            className="h-full flex-1 px-3 text-base text-foreground"
                            value={password}
                            onChangeText={setPassword}
                            editable={ready && !controller.busy}
                            secureTextEntry={!showPassword}
                            autoCapitalize="none"
                            autoCorrect={false}
                            spellCheck={false}
                            placeholder="Enter a password"
                            placeholderTextColor="rgba(255,255,255,0.3)"
                            selectionColor={COLORS.brand}
                            cursorColor={COLORS.brand}
                            returnKeyType="done"
                            onSubmitEditing={canSave ? handleSave : undefined}
                        />
                        <Pressable
                            accessibilityLabel={
                                showPassword ? "Hide password" : "Show password"
                            }
                            className="h-10 w-10 items-center justify-center rounded-lg active:bg-white/5"
                            onPress={() =>
                                setShowPassword((current) => !current)
                            }
                            hitSlop={8}
                        >
                            {showPassword ? (
                                <EyeOff
                                    size={18}
                                    color="rgba(255,255,255,0.45)"
                                />
                            ) : (
                                <Eye size={18} color="rgba(255,255,255,0.45)" />
                            )}
                        </Pressable>
                    </View>
                    {needsPassword ? (
                        <Text selectable className="px-1 text-xs text-red-400">
                            Add a password before enabling remote access.
                        </Text>
                    ) : (
                        <Text className="px-1 text-xs leading-5 text-muted-foreground">
                            Clients will need this password to connect. You can
                            clear it when remote access is off.
                        </Text>
                    )}
                </View>

                <View className="flex-row items-start gap-3 rounded-xl bg-orange-500/[0.04] p-4">
                    <Text className="flex-1 text-xs leading-5 text-white/[0.8]">
                        Remote access requires a password and uses
                        WeebHub&apos;s default secure mode. Changes take effect
                        after the server restarts.
                    </Text>
                </View>

                <Button
                    label="Save Changes"
                    icon={Save}
                    variant="primary"
                    disabled={!canSave}
                    loading={controller.busy && dirty}
                    onPress={handleSave}
                />
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
