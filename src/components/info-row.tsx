import { COLORS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react-native"
import * as React from "react"
import { Pressable, Switch, Text, View } from "react-native"

type InfoRowProps = {
    icon: LucideIcon
    title: string
    detail: string
    actionLabel?: string
    onPress?: () => void
    switchValue?: boolean
    onToggle?: (value: boolean) => void
    disabled?: boolean
}

export function InfoRow({
    icon: Icon,
    title,
    detail,
    actionLabel,
    onPress,
    switchValue,
    onToggle,
    disabled,
}: InfoRowProps) {
    const hasSwitch = typeof switchValue === "boolean" && onToggle

    return (
        <Pressable
            className={cn("flex-row items-center gap-3 rounded-lg p-2", onPress && "active:bg-white/5", disabled && "opacity-50")}
            disabled={disabled || (!onPress && !hasSwitch)}
            onPress={onPress}
        >
            <View className="h-10 w-10 items-center justify-center rounded-lg bg-white/5">
                <Icon size={19} color={COLORS.foreground} strokeWidth={2} />
            </View>
            <View className="min-w-0 flex-1 gap-0.5">
                <Text className="text-base font-medium text-foreground" numberOfLines={1}>{title}</Text>
                <Text className="text-sm leading-5 text-muted-foreground" numberOfLines={2}>{detail}</Text>
            </View>
            {hasSwitch ? (
                <Switch
                    value={switchValue}
                    onValueChange={onToggle}
                    trackColor={{ false: "rgba(255,255,255,0.16)", true: COLORS.brand }}
                    thumbColor="#ffffff"
                />
            ) : actionLabel ? (
                <Text className="text-sm font-semibold text-brand-400">{actionLabel}</Text>
            ) : null}
        </Pressable>
    )
}
