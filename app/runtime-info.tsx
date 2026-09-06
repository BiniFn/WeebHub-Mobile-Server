import { useServerController } from "@/hooks/use-server-controller"
import { formatUptime } from "@/lib/utils"
import { router } from "expo-router"
import { ChevronLeft } from "lucide-react-native"
import * as React from "react"
import { ScrollView, Text, TouchableOpacity, View } from "react-native"

export default function RuntimeInfoScreen() {
    const controller = useServerController()
    const status = controller.nativeStatus

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
                    <Text className="text-2xl font-bold text-foreground">Runtime Info</Text>
                    <Text className="text-xs text-muted-foreground mt-0.5">Process details</Text>
                </View>
            </View>

            <View className="gap-4">
                <View className="flex-row gap-4">
                    <View className="flex-1 gap-1.5 rounded-xl border border-white/5 bg-white/3 p-4">
                        <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">State</Text>
                        <Text className="text-xl font-bold capitalize text-foreground">
                            {controller.reachability.reachable ? "online" : status?.state ?? "loading"}
                        </Text>
                    </View>
                    <View className="flex-1 gap-1.5 rounded-xl border border-white/5 bg-white/3 p-4">
                        <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Uptime</Text>
                        <Text className="text-xl font-bold text-foreground">
                            {formatUptime(status?.startedAt ?? null)}
                        </Text>
                    </View>
                </View>

                <View className="gap-1.5 rounded-xl border border-white/5 bg-white/3 p-4">
                    <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Local URL</Text>
                    <Text selectable className="text-base font-semibold text-foreground">
                        {status?.url ?? "http://127.0.0.1:43211"}
                    </Text>
                    <Text className="text-xs text-muted-foreground">
                        {controller.reachability.version
                            ? `WeebHub v${controller.reachability.version}`
                            : controller.reachability.error ?? "Waiting for the server listener."}
                    </Text>
                </View>

                <View className="gap-1.5 rounded-xl border border-white/5 bg-white/3 p-4">
                    <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Data Directory</Text>
                    <Text selectable className="text-sm font-medium leading-5 text-foreground">
                        {status?.dataDir ?? "Loading..."}
                    </Text>
                    <Text className="text-xs text-muted-foreground">
                        Holds databases, image caches, logs, and server extensions.
                    </Text>
                </View>

                <View className="gap-1.5 rounded-xl border border-white/5 bg-white/3 p-4">
                    <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Config Path</Text>
                    <Text selectable className="text-sm font-medium leading-5 text-foreground">
                        {status?.configPath ?? "Loading..."}
                    </Text>
                </View>

                <View className="gap-1.5 rounded-xl border border-white/5 bg-white/3 p-4">
                    <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cache Directory</Text>
                    <Text selectable className="text-sm font-medium leading-5 text-foreground">
                        {status?.cacheDir ?? "Loading..."}
                    </Text>
                </View>
            </View>
        </ScrollView>
    )
}
