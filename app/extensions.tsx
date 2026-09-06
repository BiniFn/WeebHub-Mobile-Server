import { useServerController } from "@/hooks/use-server-controller"
import { COLORS } from "@/lib/constants"
import { getStoredString, removeStoredKey, setStoredString } from "@/lib/storage"
import { toast } from "@/lib/toast"
import { router } from "expo-router"
import { AlertCircle, Check, ChevronLeft, Download, Puzzle, RefreshCw, Search, Settings, Trash2 } from "lucide-react-native"
import * as React from "react"
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

interface Extension {
    id: string
    name: string
    description?: string
    version?: string
    author?: string
    lang?: string
    language?: string
    type: string
    icon?: string
    manifestURI?: string
}

interface InvalidExtension {
    id: string
    extension: Extension
    code?: string
}

interface AllExtensions {
    extensions?: Extension[]
    disabledExtensions?: Extension[]
    invalidExtensions?: InvalidExtension[]
}

const CATEGORY_LABELS: Record<string, string> = {
    "anime-torrent-provider": "Anime Torrents",
    "manga-provider": "Manga",
    "onlinestream-provider": "Online streaming",
    "custom-source": "Custom",
}

const CATEGORIES = [
    { id: "all", label: "All" },
    { id: "anime-torrent-provider", label: "Anime Torrents" },
    { id: "manga-provider", label: "Manga" },
    { id: "onlinestream-provider", label: "Online Streaming" },
    { id: "custom-source", label: "Custom" },
]

const ExtensionCard = React.memo(({
    ext,
    activeTab,
    actionBusy,
    isInst,
    onToggleDisabled,
    onUninstall,
    onInstall,
}: {
    ext: any
    activeTab: "installed" | "marketplace"
    actionBusy: boolean
    isInst: boolean
    onToggleDisabled: (id: string, currentlyDisabled: boolean, name: string) => void
    onUninstall: (id: string, name: string) => void
    onInstall: (manifestUri: string) => void
}) => {
    const typeLabel = CATEGORY_LABELS[ext.type] ?? ext.type

    return (
        <View className="p-4 rounded-2xl border border-white/5 bg-gray-950/40 gap-3">
            <View className="flex-row items-start justify-between gap-3">
                <View className="flex-1 flex-row items-center gap-3">
                    {ext.icon ? (
                        <Image
                            source={{ uri: ext.icon }}
                            className="h-11 w-11 rounded-xl bg-white/5 border border-white/10"
                            resizeMode="cover"
                        />
                    ) : (
                        <View className="h-11 w-11 items-center justify-center rounded-xl bg-white/5 border border-white/10">
                            <Text className="text-xl font-bold text-white/50">
                                {ext.name ? ext.name[0].toUpperCase() : "E"}
                            </Text>
                        </View>
                    )}

                    <View className="flex-1 gap-0.5">
                        <Text className="text-base font-semibold text-foreground" numberOfLines={1}>
                            {ext.name}
                        </Text>
                        <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                            {typeLabel} - By {ext.author ?? "Unknown"}
                        </Text>
                    </View>
                </View>

                <View className="flex-row items-center gap-2">
                    {activeTab === "installed" ? (
                        ext.manifestURI === "builtin" ? (
                            <View className="bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg">
                                <Text className="text-xs font-semibold text-white/40 italic">Built-in</Text>
                            </View>
                        ) : (
                            <>
                                <Switch
                                    value={!ext.disabled && !ext.invalid}
                                    disabled={ext.invalid || actionBusy}
                                    onValueChange={() => onToggleDisabled(ext.id, ext.disabled, ext.name)}
                                    trackColor={{ false: "rgba(255,255,255,0.08)", true: COLORS.brand }}
                                    thumbColor="#ffffff"
                                />
                                <TouchableOpacity
                                    className="h-9 w-9 items-center justify-center rounded-lg bg-red-400/10 active:bg-red-400/20"
                                    disabled={actionBusy}
                                    onPress={() => onUninstall(ext.id, ext.name)}
                                >
                                    <Trash2 size={15} color={"#fca5a5"} />
                                </TouchableOpacity>
                            </>
                        )
                    ) : (
                        isInst ? (
                            <View className="h-9 flex-row items-center gap-1 bg-green-400/5 px-3 rounded-lg">
                                <Check size={14} color={COLORS.success} />
                                <Text className="text-xs font-semibold text-green-200">Installed</Text>
                            </View>
                        ) : (
                            <TouchableOpacity
                                className="h-9 flex-row items-center gap-1.5 bg-white/5 active:opacity-90 px-3 rounded-lg"
                                disabled={actionBusy}
                                onPress={() => onInstall(ext.manifestURI)}
                            >
                                <Download size={14} color="#fff" strokeWidth={2.5} />
                                <Text className="text-xs font-bold text-white">Install</Text>
                            </TouchableOpacity>
                        )
                    )}
                </View>
            </View>

            <View className="flex-row flex-wrap items-center gap-1.5">
                {ext.version ? (
                    <View className="bg-white/5 border border-white/5 px-2 py-0.5 rounded-md">
                        <Text className="text-[10px] font-semibold text-white/55">v{ext.version}</Text>
                    </View>
                ) : null}
                {ext.language ? (
                    <View className="bg-white/5 border border-white/5 px-2 py-0.5 rounded-md">
                        <Text className="text-[10px] font-semibold text-white/55">{ext.language}</Text>
                    </View>
                ) : null}
                {ext.lang ? (
                    <View className="bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-md">
                        <Text className="text-[10px] font-semibold text-blue-300/80">{ext.lang.toUpperCase()}</Text>
                    </View>
                ) : null}
                {ext.invalid ? (
                    <View className="bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-md flex-row items-center gap-1">
                        <AlertCircle size={10} color={COLORS.danger} />
                        <Text className="text-[10px] font-semibold text-red-400">Error</Text>
                    </View>
                ) : null}
            </View>

            {ext.description ? (
                <Text className="text-xs text-muted-foreground leading-4 mt-1">
                    {ext.description}
                </Text>
            ) : null}
        </View>
    )
})

export default function ExtensionsScreen() {
    const controller = useServerController()
    const insets = useSafeAreaInsets()

    const [activeTab, setActiveTab] = React.useState<"installed" | "marketplace">("installed")
    const [filterType, setFilterType] = React.useState("all")
    const [searchTerm, setSearchTerm] = React.useState("")

    const [installed, setInstalled] = React.useState<AllExtensions | null>(null)
    const [marketplace, setMarketplace] = React.useState<Extension[] | null>(null)
    const [loading, setLoading] = React.useState(false)
    const [actionBusy, setActionBusy] = React.useState(false)

    const [isMarketplaceModalOpen, setIsMarketplaceModalOpen] = React.useState(false)
    const [customMarketplaceUrlInput, setCustomMarketplaceUrlInput] = React.useState("")

    React.useEffect(() => {
        if (isMarketplaceModalOpen) {
            setCustomMarketplaceUrlInput(getStoredString("marketplace-url") ?? "")
        }
    }, [isMarketplaceModalOpen])

    const fetchAll = React.useCallback(async () => {
        if (!controller.reachability.reachable) return

        setLoading(true)
        try {
            const resAll = await controller.request<any>("/api/v1/extensions/all", {
                method: "POST",
                body: { withUpdates: false },
            })
            if (resAll.error) throw new Error(resAll.error)

            const storedMarketplaceUrl = getStoredString("marketplace-url")
            let marketUrl = "/api/v1/extensions/marketplace"
            if (storedMarketplaceUrl) {
                marketUrl += `?marketplace=${encodeURIComponent(storedMarketplaceUrl)}`
            }

            const resMarket = await controller.request<any>(marketUrl)
            if (resMarket.error) throw new Error(resMarket.error)

            const filteredInstalled: AllExtensions = {
                extensions: (resAll.data?.extensions ?? []).filter((ext: Extension) => ext.type !== "plugin"),
                disabledExtensions: (resAll.data?.disabledExtensions ?? []).filter((ext: Extension) => ext.type !== "plugin"),
                invalidExtensions: (resAll.data?.invalidExtensions ?? []).filter((item: InvalidExtension) => item.extension?.type !== "plugin"),
            }

            const filteredMarket: Extension[] = (resMarket.data ?? []).filter((ext: Extension) => ext.type !== "plugin")

            setInstalled(filteredInstalled)
            setMarketplace(filteredMarket)
        }
        catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to load extensions")
        }
        finally {
            setLoading(false)
        }
    }, [controller.reachability.reachable, controller.request])

    React.useEffect(() => {
        if (controller.reachability.reachable) {
            fetchAll()
        }
    }, [controller.reachability.reachable, fetchAll])

    const handleInstall = React.useCallback(async (manifestUri: string) => {
        if (actionBusy) return
        setActionBusy(true)
        try {
            const res = await controller.request("/api/v1/extensions/external/install", {
                method: "POST",
                body: { manifestUri },
            })
            if (res.error) throw new Error(res.error)
            toast.success("Extension installed")
            await fetchAll()
        }
        catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to install extension")
        }
        finally {
            setActionBusy(false)
        }
    }, [controller.request, actionBusy, fetchAll])

    const handleUninstall = React.useCallback(async (id: string, name: string) => {
        if (actionBusy) return
        Alert.alert(
            "Uninstall Extension",
            `Are you sure you want to uninstall "${name}"?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Uninstall",
                    style: "destructive",
                    onPress: async () => {
                        setActionBusy(true)
                        try {
                            const res = await controller.request("/api/v1/extensions/external/uninstall", {
                                method: "POST",
                                body: { id },
                            })
                            if (res.error) throw new Error(res.error)
                            toast.success(`Uninstalled "${name}"`)
                            await fetchAll()
                        }
                        catch (error) {
                            toast.error(error instanceof Error ? error.message : "Failed to uninstall extension")
                        }
                        finally {
                            setActionBusy(false)
                        }
                    },
                },
            ],
        )
    }, [controller.request, actionBusy, fetchAll])

    const handleToggleDisabled = React.useCallback(async (id: string, currentlyDisabled: boolean, name: string) => {
        if (actionBusy) return
        setActionBusy(true)
        try {
            const res = await controller.request("/api/v1/extensions/external/disabled", {
                method: "POST",
                body: { id, disabled: !currentlyDisabled },
            })
            if (res.error) throw new Error(res.error)
            toast.success(`${currentlyDisabled ? "Enabled" : "Disabled"} "${name}"`)
            await fetchAll()
        }
        catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to update extension")
        }
        finally {
            setActionBusy(false)
        }
    }, [controller.request, actionBusy, fetchAll])

    const installedIds = React.useMemo(() => {
        const ids = new Set<string>()
        if (installed) {
            installed.extensions?.forEach(ext => ids.add(ext.id))
            installed.disabledExtensions?.forEach(ext => ids.add(ext.id))
            installed.invalidExtensions?.forEach(item => {
                if (item.extension) ids.add(item.extension.id)
            })
        }
        return ids
    }, [installed])

    const allInstalledList = React.useMemo(() => {
        if (!installed) return []
        const enabled = (installed.extensions ?? []).map(ext => ({ ...ext, disabled: false, invalid: false }))
        const disabled = (installed.disabledExtensions ?? []).map(ext => ({ ...ext, disabled: true, invalid: false }))
        const invalid = (installed.invalidExtensions ?? []).map(item => ({ ...item.extension, disabled: false, invalid: true, errorCode: item.code }))

        return [...enabled, ...disabled, ...invalid].sort((a, b) => a.name.localeCompare(b.name))
    }, [installed])

    const filteredInstalledList = React.useMemo(() => {
        let list = allInstalledList
        if (filterType !== "all") {
            list = list.filter(ext => ext.type === filterType)
        }
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase()
            list = list.filter(ext =>
                ext.name.toLowerCase().includes(term) ||
                ext.id.toLowerCase().includes(term) ||
                (ext.description && ext.description.toLowerCase().includes(term)),
            )
        }
        return list
    }, [allInstalledList, filterType, searchTerm])

    const filteredMarketplaceList = React.useMemo(() => {
        let list = marketplace ?? []
        if (filterType !== "all") {
            list = list.filter(ext => ext.type === filterType)
        }
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase()
            list = list.filter(ext =>
                ext.name.toLowerCase().includes(term) ||
                ext.id.toLowerCase().includes(term) ||
                (ext.description && ext.description.toLowerCase().includes(term)),
            )
        }
        return list
    }, [marketplace, filterType, searchTerm])

    const isReachable = controller.reachability.reachable

    return (
        <View className="flex-1 bg-background">
            <FlatList
                data={activeTab === "installed" ? filteredInstalledList : filteredMarketplaceList}
                keyExtractor={item => `${activeTab}_${item.id}`}
                contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: insets.bottom + 24 }}
                contentContainerClassName="gap-4"
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={
                    <View className="gap-6 mb-4">
                        <View className="flex-row items-center justify-between">
                            <View className="flex-row items-center gap-3">
                                <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
                                    <ChevronLeft size={24} color="white" />
                                </TouchableOpacity>
                                <View>
                                    <Text className="text-2xl font-bold text-foreground">Extensions</Text>
                                    <Text className="text-xs text-muted-foreground mt-0.5">Manage content providers</Text>
                                </View>
                            </View>

                            {isReachable && (
                                <View className="flex-row items-center gap-2">
                                    <TouchableOpacity
                                        onPress={() => setIsMarketplaceModalOpen(true)}
                                        className="h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-white/5 active:bg-white/10"
                                    >
                                        <Settings size={16} color="white" />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={fetchAll}
                                        disabled={loading}
                                        className="h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-white/5 active:bg-white/10"
                                    >
                                        <RefreshCw size={16} color="white" className={loading ? "animate-spin" : ""} />
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>

                        {!isReachable ? (
                            <View className="gap-4 rounded-2xl border border-white/5 bg-gray-950/40 p-6 items-center text-center mt-6">
                                <Puzzle size={40} color="rgba(255,255,255,0.2)" />
                                <View className="gap-1 items-center">
                                    <Text className="text-lg font-semibold text-foreground text-center">Server Offline</Text>
                                    <Text className="text-xs text-muted-foreground text-center leading-5 px-4">
                                        Start your local Seanime server to manage and download extensions.
                                    </Text>
                                </View>
                            </View>
                        ) : (
                            <View className="gap-6">
                                <View className="flex-row rounded-xl bg-white/[0.03] border border-white/5 p-1">
                                    <Pressable
                                        className={`flex-1 items-center justify-center py-2.5 rounded-lg ${activeTab === "installed"
                                            ? "bg-white/10"
                                            : ""
                                        }`}
                                        onPress={() => {
                                            setActiveTab("installed")
                                            setFilterType("all")
                                        }}
                                    >
                                        <Text
                                            className={`text-sm font-semibold ${activeTab === "installed"
                                                ? "text-foreground"
                                                : "text-muted-foreground"
                                            }`}
                                        >
                                            Installed
                                        </Text>
                                    </Pressable>
                                    <Pressable
                                        className={`flex-1 items-center justify-center py-2.5 rounded-lg ${activeTab === "marketplace"
                                            ? "bg-white/10"
                                            : ""
                                        }`}
                                        onPress={() => {
                                            setActiveTab("marketplace")
                                            if (filterType === "all") {
                                                setFilterType("anime-torrent-provider")
                                            }
                                        }}
                                    >
                                        <Text
                                            className={`text-sm font-semibold ${activeTab === "marketplace"
                                                ? "text-foreground"
                                                : "text-muted-foreground"
                                            }`}
                                        >
                                            Marketplace
                                        </Text>
                                    </Pressable>
                                </View>

                                <View className="flex-row items-center gap-2 px-3.5 py-3 rounded-xl border border-white/5 bg-black/45">
                                    <Search size={16} color="rgba(255,255,255,0.45)" />
                                    <TextInput
                                        className="flex-1 text-sm text-foreground p-0"
                                        style={{ color: "#ffffff" }}
                                        value={searchTerm}
                                        onChangeText={setSearchTerm}
                                        placeholder="Search extensions..."
                                        placeholderTextColor="rgba(255,255,255,0.4)"
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        spellCheck={false}
                                        selectionColor={COLORS.brand}
                                        cursorColor={COLORS.brand}
                                    />
                                </View>

                                <View className="gap-2">
                                    <Text className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-1">
                                        Category
                                    </Text>
                                    <ScrollView
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                        contentContainerClassName="gap-2 pr-6"
                                    >
                                        {CATEGORIES.map(cat => {
                                            if (activeTab === "marketplace" && cat.id === "all") return null
                                            const isSelected = filterType === cat.id
                                            return (
                                                <Pressable
                                                    key={cat.id}
                                                    onPress={() => setFilterType(cat.id)}
                                                    className={`h-9 flex-row items-center justify-center rounded-full px-4 border ${isSelected
                                                        ? "border-brand-500 bg-brand-500/10"
                                                        : "border-white/5 bg-white/[0.02]"
                                                    }`}
                                                >
                                                    <Text
                                                        className={`text-xs font-semibold ${isSelected ? "text-brand-400" : "text-white/60"
                                                        }`}
                                                    >
                                                        {cat.label}
                                                    </Text>
                                                </Pressable>
                                            )
                                        })}
                                    </ScrollView>
                                </View>
                            </View>
                        )}
                    </View>
                }
                renderItem={({ item }) =>
                    isReachable ? (
                        <ExtensionCard
                            ext={item}
                            activeTab={activeTab}
                            actionBusy={actionBusy}
                            isInst={installedIds.has(item.id)}
                            onToggleDisabled={handleToggleDisabled}
                            onUninstall={handleUninstall}
                            onInstall={handleInstall}
                        />
                    ) : null
                }
                ListEmptyComponent={
                    isReachable && !loading ? (
                        <View className="py-16 items-center justify-center border border-dashed border-white/5 rounded-2xl">
                            <Text className="text-sm text-muted-foreground">
                                {activeTab === "installed" ? "No installed extensions found" : "No extensions found in marketplace"}
                            </Text>
                        </View>
                    ) : null
                }
                ListFooterComponent={
                    loading ? (
                        <View className="py-20 items-center justify-center">
                            <ActivityIndicator size="large" color={COLORS.brand} />
                        </View>
                    ) : null
                }
            />

            <Modal
                visible={isMarketplaceModalOpen}
                animationType="fade"
                transparent
                onRequestClose={() => setIsMarketplaceModalOpen(false)}
            >
                <KeyboardAvoidingView
                    className="flex-1 items-center justify-center bg-black/60 px-6"
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                >
                    <View className="w-full gap-5 rounded-2xl border border-white/5 bg-gray-950 p-6 shadow-2xl">
                        <View className="gap-1.5">
                            <Text className="text-xl font-bold text-foreground">Marketplace Settings</Text>
                            <Text className="text-xs text-muted-foreground leading-4">
                                Configure a custom extensions marketplace registry URL.
                            </Text>
                        </View>

                        <View className="gap-2">
                            <Text className="text-xs font-semibold text-muted-foreground">Marketplace URL</Text>
                            <TextInput
                                className="rounded-xl border border-border bg-black/40 px-3.5 py-3.5 text-sm leading-5"
                                style={{ color: "#ffffff" }}
                                autoCapitalize="none"
                                autoCorrect={false}
                                spellCheck={false}
                                value={customMarketplaceUrlInput}
                                onChangeText={setCustomMarketplaceUrlInput}
                                placeholder="https://raw.githubusercontent.com/..."
                                placeholderTextColor="rgba(255,255,255,0.4)"
                                selectionColor={COLORS.brand}
                                cursorColor={COLORS.brand}
                            />
                        </View>

                        <View className="flex-row gap-3 mt-1">
                            <TouchableOpacity
                                className="flex-1 items-center justify-center rounded-xl bg-white/5 py-3.5 active:bg-white/10"
                                onPress={() => {
                                    removeStoredKey("marketplace-url")
                                    setIsMarketplaceModalOpen(false)
                                    fetchAll()
                                }}
                            >
                                <Text className="text-sm font-semibold text-white/70">Reset</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                className="flex-1 items-center justify-center rounded-xl bg-brand-500 py-3.5 active:opacity-90"
                                onPress={() => {
                                    if (customMarketplaceUrlInput.trim()) {
                                        setStoredString("marketplace-url", customMarketplaceUrlInput.trim())
                                    } else {
                                        removeStoredKey("marketplace-url")
                                    }
                                    setIsMarketplaceModalOpen(false)
                                    fetchAll()
                                }}
                            >
                                <Text className="text-sm font-semibold text-white">Save</Text>
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity
                            className="items-center justify-center py-2"
                            onPress={() => setIsMarketplaceModalOpen(false)}
                        >
                            <Text className="text-xs font-semibold text-muted-foreground">Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    )
}
