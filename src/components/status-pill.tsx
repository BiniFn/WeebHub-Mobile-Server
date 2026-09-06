import { COLORS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import type { SeanimeServerState } from "@modules/seanime-server"
import { Circle, CircleDashed } from "lucide-react-native"
import * as React from "react"
import { Text, View } from "react-native"

type StatusPillProps = {
    state: SeanimeServerState | null
    reachable: boolean
    checking: boolean
}

export function StatusPill({ state, reachable, checking }: StatusPillProps) {
    const tone = reachable ? "running" : state ?? "stopped"
    const label = checking ? "Checking" : reachable ? "Online" : state === "starting" ? "Starting" : "Offline"
    const Icon = checking ? CircleDashed : Circle

    return (
        <View
            className={cn(
                "h-9 flex-row items-center gap-2 rounded-full border px-3",
                tone === "running" && "border-emerald-400/30 bg-emerald-400/10",
                tone === "starting" && "border-amber-400/30 bg-amber-400/10",
                (tone === "stopped" || tone === "error") && "border-white/10 bg-white/5",
            )}
        >
            <Icon
                size={13}
                color={reachable ? COLORS.success : state === "starting" ? COLORS.warning : COLORS.muted}
                fill={checking ? "transparent" : reachable ? COLORS.success : "transparent"}
            />
            <Text className="text-sm font-medium text-foreground">{label}</Text>
        </View>
    )
}
