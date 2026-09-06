import { Button } from "@/components/button"
import { useServerController } from "@/hooks/use-server-controller"
import { COLORS } from "@/lib/constants"
import { router } from "expo-router"
import { ChevronLeft, RefreshCw, Save, Trash2 } from "lucide-react-native"
import * as React from "react"
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native"

export default function ConfigEditorScreen() {
    const controller = useServerController()
    const canSave = controller.configDirty && !controller.busy

    const handleReset = React.useCallback(() => {
        Alert.alert(
            "Reset config.toml",
            "Restore the mobile default WeebHub config.",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Reset", style: "destructive", onPress: controller.restoreConfig },
            ],
        )
    }, [controller.restoreConfig])

    return (
        <KeyboardAvoidingView
            className="flex-1 bg-background"
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            <ScrollView
                className="flex-1"
                contentContainerClassName="px-6 pb-12 pt-6 gap-6"
                keyboardShouldPersistTaps="handled"
            >
                <View className="flex-row items-center gap-3">
                    <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
                        <ChevronLeft size={24} color="white" />
                    </TouchableOpacity>
                    <View>
                        <Text className="text-2xl font-bold text-foreground">config.toml</Text>
                        <Text className="text-xs text-muted-foreground mt-0.5">Edit server settings file</Text>
                    </View>
                </View>

                <TextInput
                    className="h-64 rounded-xl border border-white/5 bg-black/40 px-4 py-4 font-mono text-sm leading-5"
                    style={{ color: "#ffffff" }}
                    multiline
                    autoCapitalize="none"
                    autoCorrect={false}
                    spellCheck={false}
                    value={controller.configDraft}
                    onChangeText={controller.updateDraft}
                    placeholder="config.toml"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    selectionColor={COLORS.brand}
                    cursorColor={COLORS.brand}
                    textAlignVertical="top"
                />

                <View className="gap-3">
                    <View className="flex-row gap-3">
                        <Button
                            className="flex-1"
                            label="Save"
                            icon={Save}
                            variant="primary"
                            disabled={!canSave}
                            loading={controller.busy && controller.configDirty}
                            onPress={controller.saveConfig}
                        />
                        <Button
                            className="flex-1"
                            label="Discard Changes"
                            icon={RefreshCw}
                            variant="secondary"
                            disabled={controller.busy}
                            onPress={controller.reloadConfig}
                        />
                    </View>
                    <Button
                        label="Reset to Defaults"
                        icon={Trash2}
                        variant="ghost"
                        disabled={controller.busy}
                        onPress={handleReset}
                    />
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    )
}
