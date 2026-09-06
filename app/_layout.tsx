import "../global.css"
import { AppReleaseUpdatePrompt } from "@/lib/app-release-updates"
import { COLORS } from "@/lib/constants"
import { OtaUpdatePrompt } from "@/lib/updates"
import { Stack } from "expo-router"
import * as SplashScreen from "expo-splash-screen"
import { StatusBar } from "expo-status-bar"
import * as SystemUI from "expo-system-ui"
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react-native"
import * as React from "react"
import { StyleSheet, Text, View } from "react-native"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { SafeAreaView } from "react-native-safe-area-context"
import Toast, { BaseToastProps } from "react-native-toast-message"
import { Uniwind } from "uniwind"

SplashScreen.preventAutoHideAsync().catch(() => {})
SystemUI.setBackgroundColorAsync(COLORS.background).catch(() => {})

function CompactToast({
    icon: Icon,
    iconColor,
    text,
}: {
    icon: any
    iconColor: string
    text: string
}) {
    return (
        <View
            className="max-w-[85%] self-center flex-row items-center gap-2.5 rounded-xl border border-white/5 bg-neutral-900/95 px-4 py-3"
            style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 6,
            }}
        >
            <Icon size={16} color={iconColor} />
            <Text className="shrink text-sm font-medium text-white/90" numberOfLines={3}>
                {text}
            </Text>
        </View>
    )
}

const toastConfig = {
    success: (props: BaseToastProps) => (
        <CompactToast icon={CheckCircle2} iconColor="#4ade80" text={props.text2 || ""} />
    ),
    error: (props: BaseToastProps) => (
        <CompactToast icon={XCircle} iconColor="#f87171" text={props.text2 || ""} />
    ),
    info: (props: BaseToastProps) => (
        <CompactToast icon={Info} iconColor="#9f92ff" text={props.text2 || ""} />
    ),
    warning: (props: BaseToastProps) => (
        <CompactToast icon={AlertTriangle} iconColor="#fbbf24" text={props.text2 || ""} />
    ),
}

export default function RootLayout() {
    const [isReady, setIsReady] = React.useState(false)

    React.useEffect(() => {
        Uniwind.setTheme("dark")
        setIsReady(true)
        SplashScreen.hideAsync().catch(() => {})
    }, [])

    if (!isReady) {
        return null
    }

    return (
        <GestureHandlerRootView style={styles.root}>
            <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
                <StatusBar style="light" />
                <OtaUpdatePrompt />
                <AppReleaseUpdatePrompt />
                <Stack screenOptions={{ headerShown: false }} />
                <Toast config={toastConfig} />
            </SafeAreaView>
        </GestureHandlerRootView>
    )
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    safeArea: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
})
