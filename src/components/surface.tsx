import { cn } from "@/lib/utils"
import * as React from "react"
import { Text, View, type ViewProps } from "react-native"

type SurfaceProps = ViewProps & {
    title?: string
    detail?: string
}

export function Surface({ title, detail, className, children, ...props }: SurfaceProps) {
    return (
        <View
            className={cn("gap-4 rounded-lg border border-border bg-card/80 p-4", className)}
            {...props}
        >
            {title || detail ? (
                <View className="gap-1">
                    {title ? <Text className="text-lg font-semibold text-foreground">{title}</Text> : null}
                    {detail ? <Text className="text-sm leading-5 text-muted-foreground">{detail}</Text> : null}
                </View>
            ) : null}
            {children}
        </View>
    )
}
