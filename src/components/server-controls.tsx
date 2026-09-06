import { Button } from "@/components/button"
import { cn } from "@/lib/utils"
import { ChevronRight, Copy, Link2, Power, RefreshCw, Settings, Smartphone } from "lucide-react-native"
import type { LucideIcon } from "lucide-react-native"
import { ActivityIndicator, Pressable, Text, View } from "react-native"
import { RowDivider } from "./profile-menu"

type RowProps = {
    icon: LucideIcon
    label: string
    detail: string
    action: string
    actionIcon?: LucideIcon
    disabled?: boolean
    loading?: boolean
    last?: boolean
    selectable?: boolean
    onPress: () => void
}

function ControlRow({
    icon: Icon,
    label,
    detail,
    action,
    actionIcon: ActionIcon,
    disabled,
    loading,
    last,
    selectable,
    onPress,
}: RowProps) {
    return (
        <Pressable
            className={cn(
                "flex-row items-center px-4 py-3 active:bg-white/5",
                // !last && "border-b border-white/5",
            )}
            disabled={disabled || loading}
            onPress={onPress}
            role="button"
            accessibilityLabel={`${action} ${label}`}
        >
            <Icon size={20} color="rgba(255, 255, 255, 0.45)" />

            <View className="ml-3.5 min-w-0 flex-1 gap-0.5">
                <Text className="text-base font-medium text-foreground">{label}</Text>
                <Text
                    className="text-xs text-muted-foreground"
                    numberOfLines={1}
                    selectable={selectable}
                >
                    {detail}
                </Text>
            </View>

            <View
                className={cn(
                    "ml-3 flex-row items-center gap-1.5",
                    disabled && "opacity-40",
                )}
            >
                {loading ? (
                    <ActivityIndicator size="small" color="rgba(255, 255, 255, 0.65)" />
                ) : ActionIcon ? (
                    <ActionIcon size={14} color="rgba(255, 255, 255, 0.65)" />
                ) : null}
                <Text className="text-xs font-semibold text-foreground/80">{action}</Text>
            </View>
        </Pressable>
    )
}

type Props = {
    running: boolean
    reachable: boolean
    busy: boolean
    checking: boolean
    url?: string
    onPower: () => void
    onCopy: () => void
    onSettings: () => void
    onRefresh: () => void
    onTenji: () => void
}

export function ServerControls({
    running,
    reachable,
    busy,
    checking,
    url,
    onPower,
    onCopy,
    onSettings,
    onRefresh,
    onTenji,
}: Props) {
    const connection = checking
        ? "Checking connection..."
        : reachable
            ? "Connected locally"
            : running
                ? "Connecting..."
                : "Server stopped"

    const canConnect = running && Boolean(url)

    return (
        <View className="gap-3">

            <Button
                className="h-14"
                label={running ? "Stop Server" : "Start Server"}
                icon={Power}
                variant={running ? "danger" : "primary"}
                loading={busy}
                onPress={onPower}
            />

            <View className="overflow-hidden rounded-xl border border-white/5 bg-gray-950/60 border-continuous">
                <View className="bg-white/3">
                    <ControlRow
                        icon={Link2}
                        label="Local Address"
                        detail={canConnect && url ? url : "Available when the server is running"}
                        action="Copy"
                        actionIcon={Copy}
                        disabled={!canConnect}
                        selectable={canConnect}
                        onPress={onCopy}
                    />
                    <RowDivider />
                    <ControlRow
                        icon={Settings}
                        label="WeebHub Settings / Web UI"
                        detail="Available in the web interface"
                        action="Open"
                        disabled={!canConnect}
                        onPress={onSettings}
                    />
                    <RowDivider />
                    <ControlRow
                        icon={RefreshCw}
                        label="Connection"
                        detail={connection}
                        action="Refresh"
                        loading={checking}
                        last
                        onPress={onRefresh}
                    />
                </View>
            </View>

            <View className="overflow-hidden rounded-xl border border-white/5 bg-gray-950/60 border-continuous">
                <View className="bg-white/3">
                    <Pressable
                        className="flex-row items-center px-4 py-4 active:bg-white/5"
                        onPress={onTenji}
                        role="button"
                    >
                        <Smartphone size={20} color="rgba(255, 255, 255, 0.45)" />
                        <Text className="ml-3.5 flex-1 text-base font-medium text-foreground">
                            Open WeebHub Tenji
                        </Text>
                        <ChevronRight size={18} color="rgba(255, 255, 255, 0.25)" />
                    </Pressable>
                </View>
            </View>
        </View>
    )
}
