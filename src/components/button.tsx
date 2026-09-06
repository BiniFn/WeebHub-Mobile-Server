import { COLORS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react-native"
import * as React from "react"
import { ActivityIndicator, Pressable, type PressableProps, Text } from "react-native"

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger"

type ButtonProps = PressableProps & {
    label: string
    icon?: LucideIcon
    variant?: ButtonVariant
    loading?: boolean
}

const buttonClasses: Record<ButtonVariant, string> = {
    primary: "bg-primary active:opacity-90",
    secondary: "border border-border bg-card active:bg-white/10",
    ghost: "bg-transparent active:bg-white/10",
    danger: "bg-destructive active:opacity-90",
}

const labelClasses: Record<ButtonVariant, string> = {
    primary: "text-primary-foreground",
    secondary: "text-foreground",
    ghost: "text-foreground",
    danger: "text-destructive-foreground",
}

export function Button({
    label,
    icon: Icon,
    variant = "secondary",
    loading = false,
    disabled,
    className,
    ...props
}: ButtonProps) {
    const textColor = variant === "primary" ? COLORS.background : COLORS.foreground

    return (
        <Pressable
            className={cn(
                "h-12 flex-row items-center justify-center gap-2 rounded-xl px-4",
                buttonClasses[variant],
                (disabled || loading) && "opacity-50",
                className,
            )}
            disabled={disabled || loading}
            role="button"
            {...props}
        >
            {loading ? (
                <ActivityIndicator size="small" color={textColor} />
            ) : Icon ? (
                <Icon size={18} color={textColor} strokeWidth={2.2} />
            ) : null}
            <Text className={cn("text-base font-semibold", labelClasses[variant])} numberOfLines={1}>
                {label}
            </Text>
        </Pressable>
    )
}
