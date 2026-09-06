import { Button } from "@/components/button"
import { useServerController } from "@/hooks/use-server-controller"
import { COLORS } from "@/lib/constants"
import * as Linking from "expo-linking"
import { router } from "expo-router"
import { ChevronLeft, Chrome, ExternalLink, HelpCircle } from "lucide-react-native"
import * as React from "react"
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

export default function GettingStartedScreen() {
    const controller = useServerController()
    const insets = useSafeAreaInsets()
    const scrollViewRef = React.useRef<ScrollView>(null)

    const [anilistToken, setAnilistToken] = React.useState("")
    const [libraryPath, setLibraryPath] = React.useState(
        Platform.OS === "android" ? "/storage/emulated/0/Download/Anime" : "/Anime",
    )
    const [showHelp, setShowHelp] = React.useState(false)

    React.useEffect(() => {
        const showSubscription = Keyboard.addListener("keyboardDidShow", () => {
            scrollViewRef.current?.scrollToEnd({ animated: true })
        })
        return () => {
            showSubscription.remove()
        }
    }, [])

    const handleOpenAuth = React.useCallback(() => {
        Linking.openURL("https://anilist.co/api/v2/oauth/authorize?client_id=13985&response_type=token").catch(() => { })
    }, [])

    const handleSave = React.useCallback(async () => {
        await controller.setupServer(anilistToken.trim(), libraryPath.trim())
        router.replace("/")
    }, [anilistToken, libraryPath, controller.setupServer])

    return (
        <KeyboardAvoidingView
            className="flex-1 bg-background"
            behavior="padding"
        >
            <ScrollView
                ref={scrollViewRef}
                className="flex-1"
                contentContainerClassName="px-6 pb-12 pt-6"
                keyboardShouldPersistTaps="handled"
            >
                <View className="flex-row items-center gap-3 pb-8">
                    <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
                        <ChevronLeft size={24} color="white" />
                    </TouchableOpacity>
                    <View>
                        <Text className="text-2xl font-bold text-foreground">Getting Started</Text>
                        <Text className="text-xs text-muted-foreground mt-0.5">Initialize server settings</Text>
                    </View>
                </View>

                <View className="gap-6">
                    <View className="gap-3 rounded-xl border border-white/5 bg-gray-950/40 p-4">
                        <Text className="text-sm font-semibold text-foreground">1. AniList Account (Optional)</Text>
                        <Text className="text-sm leading-5 text-muted-foreground">
                            You can skip this step and configure it later from the web interface.
                        </Text>

                        <TouchableOpacity
                            className="flex-row items-center gap-2 rounded-lg bg-brand-500/10 border border-brand-500/25 px-4 py-3 active:bg-brand-500/20 mt-1"
                            onPress={handleOpenAuth}
                        >
                            <Chrome size={18} color={COLORS.brand} />
                            <Text className="flex-1 text-sm font-semibold text-brand-400">Login with AniList in Browser</Text>
                            <ExternalLink size={16} color={COLORS.brand} />
                        </TouchableOpacity>

                        <View className="gap-1.5 mt-2">
                            <Text className="text-xs font-semibold text-muted-foreground">Paste Access Token</Text>
                            <TextInput
                                className="rounded-lg border border-border bg-black/40 px-3.5 py-3 text-sm leading-5"
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
                            <Text className="text-[11px] text-muted-foreground/60 leading-4">
                                Authorize WeebHub in the browser window, then copy and paste the access token here. Leave blank if you don't use
                                AniList.
                            </Text>
                        </View>
                    </View>

                    <View className="gap-3 rounded-xl border border-white/5 bg-gray-950/40 p-4">
                        <View className="flex-row justify-between items-center">
                            <Text className="text-sm font-semibold text-foreground">2. Library Directory</Text>
                            <TouchableOpacity
                                onPress={() => setShowHelp(!showHelp)}
                                className="flex-row items-center gap-1 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 active:bg-white/10"
                            >
                                <HelpCircle size={13} color="rgba(255, 255, 255, 0.7)" />
                                <Text className="text-xs font-medium text-white/70">Help</Text>
                            </TouchableOpacity>
                        </View>
                        <Text className="text-sm leading-5 text-muted-foreground">
                            Specify the folder on this device where your anime video files are located.
                        </Text>

                        {showHelp && (
                            <View className="rounded-lg border border-brand-500/15 bg-brand-500/[0.03] p-3 gap-2">
                                <Text className="text-xs font-bold text-brand-400">
                                    {Platform.OS === "android" ? "Android Storage" : "iOS Storage"}
                                </Text>
                                <Text className="text-[11px] text-muted-foreground leading-4">
                                    {Platform.OS === "android"
                                        ? "Android implements Scoped Storage. A default path to the Download/Anime directory has been pre-filled. You must create this folder manually on your device's storage (using a File Explorer, navigate to 'Download' and create a new folder named 'Anime'). If storing files on an external SD card, use the format '/storage/XXXX-XXXX/Anime' (replace XXXX-XXXX with your SD card ID). Make sure to grant external storage permission on the dashboard."
                                        : "iOS is strictly sandboxed. Leaving this empty defaults to the root of the 'WeebHub Mobile Server' folder in the native Files app (under 'On My iPhone'). You can transfer media directly into this folder using Finder/iTunes or the Files app."}
                                </Text>
                            </View>
                        )}

                        <View className="gap-1.5 mt-1">
                            <Text className="text-xs font-semibold text-muted-foreground">Local path (Optional)</Text>
                            <TextInput
                                className="rounded-lg border border-border bg-black/40 px-3.5 py-3 text-sm leading-5"
                                style={{ color: "#ffffff" }}
                                autoCapitalize="none"
                                autoCorrect={false}
                                spellCheck={false}
                                value={libraryPath}
                                onChangeText={setLibraryPath}
                                placeholder="/path/to/anime"
                                placeholderTextColor="rgba(255,255,255,0.4)"
                                selectionColor={COLORS.brand}
                                cursorColor={COLORS.brand}
                            />
                            <Text className="text-[11px] text-muted-foreground/60 leading-4">
                                You can leave the default path and change it later in the main settings.
                            </Text>
                        </View>
                    </View>

                    <Button
                        label="Save & Setup"
                        disabled={controller.busy}
                        loading={controller.busy}
                        variant="primary"
                        onPress={handleSave}
                    />
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    )
}
