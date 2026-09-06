import { COLORS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { ChevronRight } from "lucide-react-native"
import type { LucideIcon } from "lucide-react-native"
import * as React from "react"
import { Pressable, Switch, Text, View } from "react-native"

export function ProfileMenuSection({
    title,
    children,
    className,
}: {
    title?: string
    children: React.ReactNode
    className?: string
}) {
    return (
        <View className={cn("gap-2", className)}>
            {title ? (
                <Text className="px-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
                    {title}
                </Text>
            ) : null}
            <View className="overflow-hidden rounded-xl border border-white/5 bg-gray-950/60">
                <View className="bg-white/3">{children}</View>
            </View>
        </View>
    )
}

export function RowDivider({ className }: { className?: string }) {
    return <View className={cn("mx-4 h-px bg-white/5", className)} />
}

export function ProfileMenuItem({
    icon: Icon,
    label,
    detail,
    accessory,
    onPress,
    disabled,
    hideChevron,
}: {
    icon: LucideIcon
    label: string
    detail?: string
    accessory?: React.ReactNode
    onPress?: () => void
    disabled?: boolean
    hideChevron?: boolean
}) {
    return (
        <Pressable
            className={cn(
                "flex-row items-center px-4 py-4 active:bg-white/5",
                disabled && "opacity-50",
            )}
            disabled={disabled || !onPress}
            onPress={onPress}
        >
            <Icon size={20} color="rgba(255, 255, 255, 0.45)" />
            <View className="ml-3.5 flex-1 gap-0.5">
                <Text className="text-base font-medium text-foreground">{label}</Text>
                {detail ? (
                    <Text className="text-xs text-muted-foreground">{detail}</Text>
                ) : null}
            </View>
            {accessory ? (
                <View className="mr-2 flex-row items-center gap-2">
                    {accessory}
                </View>
            ) : null}
            {!hideChevron && onPress && (
                <ChevronRight size={18} color="rgba(255, 255, 255, 0.25)" />
            )}
        </Pressable>
    )
}

export function ProfileMenuToggle({
    icon: Icon,
    label,
    detail,
    value,
    onToggle,
    disabled,
}: {
    icon: LucideIcon
    label: string
    detail?: string
    value: boolean
    onToggle: (value: boolean) => void
    disabled?: boolean
}) {
    return (
        <View className={cn("flex-row items-center px-4 py-4", disabled && "opacity-50")}>
            <Icon size={20} color="rgba(255, 255, 255, 0.45)" />
            <View className="ml-3.5 flex-1 gap-0.5">
                <Text className="text-base font-medium text-foreground">{label}</Text>
                {detail ? (
                    <Text className="text-xs text-muted-foreground">{detail}</Text>
                ) : null}
            </View>
            <Switch
                value={value}
                onValueChange={onToggle}
                disabled={disabled}
                trackColor={{ false: "rgba(255,255,255,0.08)", true: COLORS.brand }}
                thumbColor="#ffffff"
            />
        </View>
    )
}
