import { validateConfigToml } from "@/lib/config-validation"
import { SERVER_PORT } from "@/lib/constants"
import { appendOfflineLog } from "@/lib/offline-logger"
import { readServerAccess, setServerAccess } from "@/lib/server-access"
import { toast } from "@/lib/toast"
import {
    type ConfigFileResult,
    copyToClipboard,
    getStatus,
    openAppSettings,
    openBatteryOptimizationSettings,
    openManageExternalStorageSettings,
    readConfig,
    requestNotificationPermission,
    resetConfig,
    type SeanimeServerStatus,
    setDataDir,
    setStartOnBoot,
    startServer,
    stopServer,
    writeConfig,
} from "@modules/seanime-server"
import Hex from "crypto-js/enc-hex"
import SHA256 from "crypto-js/sha256"
import * as Haptics from "expo-haptics"
import * as React from "react"
import { Alert } from "react-native"

export type SeaResponse<T> = {
    error?: string
    data?: T
}

type ServerReachability = {
    reachable: boolean
    checking: boolean
    version: string | null
    ready: boolean | null
    error: string | null
    hasSettings: boolean
    hasUser: boolean
    viewerName: string | null
    viewerAvatar: string | null
    offline: boolean
}

type ServerControllerState = {
    nativeStatus: SeanimeServerStatus | null
    config: ConfigFileResult | null
    configDraft: string
    configDirty: boolean
    reachability: ServerReachability
    busy: boolean
    serverAuthToken: string | null
}

type StartTrace = {
    scope: "server-start" | "server-restart"
    startedAt: number
    attempts: number
}

const START_TRACE_DELAY_MS = 15_000

const initialReachability: ServerReachability = {
    reachable: false,
    checking: false,
    version: null,
    ready: null,
    error: null,
    hasSettings: false,
    hasUser: false,
    viewerName: null,
    viewerAvatar: null,
    offline: false,
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null
}

function getMinStatus(value: unknown) {
    if (!isRecord(value) || !isRecord(value.data)) {
        return { version: null, ready: null, hasSettings: false, hasUser: false, viewerName: null, viewerAvatar: null, offline: false }
    }

    const version = typeof value.data.version === "string" ? value.data.version : null
    const ready = typeof value.data.serverReady === "boolean" ? value.data.serverReady : null

    const settings = value.data.settings
    const hasSettings = !!settings && isRecord(settings) && Object.keys(settings).length > 0

    const user = value.data.user
    const hasUser = !!user && isRecord(user) && !user.isSimulated && user.token !== "SIMULATED"

    let viewerName: string | null = null
    let viewerAvatar: string | null = null

    if (hasUser && isRecord(user.viewer)) {
        viewerName = typeof user.viewer.name === "string" ? user.viewer.name : null
        if (isRecord(user.viewer.avatar)) {
            viewerAvatar = typeof user.viewer.avatar.large === "string" ? user.viewer.avatar.large : null
        }
    }

    const offline = typeof value.data.isOffline === "boolean" ? value.data.isOffline : false

    return { version, ready, hasSettings, hasUser, viewerName, viewerAvatar, offline }
}

function extractServerOffline(tomlContent: string): boolean {
    const serverSectionMatch = tomlContent.match(/\[server\]([\s\S]*?)(?:\[\w+\]|$)/)
    if (!serverSectionMatch) return false

    const serverSection = serverSectionMatch[1]
    const offlineMatch = serverSection.match(/^\s*offline\s*=\s*(true|false)/m)
    if (offlineMatch) {
        return offlineMatch[1].trim() === "true"
    }
    return false
}

function setOfflineInToml(toml: string, offline: boolean): string {
    const serverSectionMatch = toml.match(/\[server\]([\s\S]*?)(?:\[\w+\]|$)/)
    if (!serverSectionMatch) {
        return toml + `\n[server]\noffline = ${offline}\n`
    }
    const serverSection = serverSectionMatch[0]
    const serverContent = serverSectionMatch[1]

    if (/\boffline\s*=/.test(serverContent)) {
        const updatedContent = serverContent.replace(/^(\s*offline\s*=\s*)(true|false)/m, `$1${offline}`)
        return toml.replace(serverSection, `[server]${updatedContent}`)
    } else {
        return toml.replace("[server]", `[server]\noffline = ${offline}`)
    }
}

function hashServerPassword(password: string): string {
    return SHA256(password).toString(Hex)
}

async function fetchServerStatus(url: string, token?: string | null): Promise<ServerReachability> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 1600)

    try {
        const headers: Record<string, string> = {
            Accept: "application/json",
        }
        if (token) {
            headers["X-Seanime-Token"] = token
        }

        const response = await fetch(`${url}/api/v1/status`, {
            method: "GET",
            headers,
            signal: controller.signal,
        })

        if (!response.ok) {
            return {
                reachable: false,
                checking: false,
                version: null,
                ready: null,
                error: `HTTP ${response.status}`,
                hasSettings: false,
                hasUser: false,
                viewerName: null,
                viewerAvatar: null,
                offline: false,
            }
        }

        const body: unknown = await response.json()
        const parsed = getMinStatus(body)

        return {
            reachable: true,
            checking: false,
            version: parsed.version,
            ready: parsed.ready,
            error: null,
            hasSettings: parsed.hasSettings,
            hasUser: parsed.hasUser,
            viewerName: parsed.viewerName,
            viewerAvatar: parsed.viewerAvatar,
            offline: parsed.offline,
        }
    }
    catch (error) {
        const message = error instanceof Error
            ? error.name === "AbortError"
                ? "timeout after 1600ms"
                : `${error.name}: ${error.message}`
            : "Server did not respond"
        return {
            reachable: false,
            checking: false,
            version: null,
            ready: null,
            error: message,
            hasSettings: false,
            hasUser: false,
            viewerName: null,
            viewerAvatar: null,
            offline: false,
        }
    }
    finally {
        clearTimeout(timeout)
    }
}

async function tickHaptic() {
    if (process.env.EXPO_OS === "ios") {
        await Haptics.selectionAsync()
    }
}

export function useServerController() {
    const [state, setState] = React.useState<ServerControllerState>({
        nativeStatus: null,
        config: null,
        configDraft: "",
        configDirty: false,
        reachability: initialReachability,
        busy: false,
        serverAuthToken: null,
    })

    const tokenRef = React.useRef<string | null>(null)
    const startTraceRef = React.useRef<StartTrace | null>(null)

    const refreshStatus = React.useCallback(async (background = false) => {
        const status = await getStatus()
        if (!background) {
            setState(current => ({
                ...current,
                nativeStatus: status,
                reachability: { ...current.reachability, checking: true },
            }))
        } else {
            setState(current => ({
                ...current,
                nativeStatus: status,
            }))
        }

        const reachability = await fetchServerStatus(status.url, tokenRef.current)
        const trace = startTraceRef.current
        if (trace) {
            trace.attempts += 1
            const elapsedMs = Date.now() - trace.startedAt

            if (reachability.reachable) {
                appendOfflineLog("info", trace.scope, [{
                    event: "status-reachable",
                    elapsedMs,
                    attempts: trace.attempts,
                    nativeState: status.state,
                    version: reachability.version,
                    ready: reachability.ready,
                }], true)
                startTraceRef.current = null
            } else if (elapsedMs >= START_TRACE_DELAY_MS) {
                appendOfflineLog("warning", trace.scope, [{
                    event: "status-unreachable",
                    elapsedMs,
                    attempts: trace.attempts,
                    nativeState: status.state,
                    nativeRunning: status.isRunning,
                    nativeError: status.lastError,
                    probeError: reachability.error,
                    port: status.port,
                }], true)
                startTraceRef.current = null
            }
        }

        setState(current => ({
            ...current,
            nativeStatus: status,
            reachability,
        }))
    }, [])

    const refreshConfig = React.useCallback(async (replaceDraft: boolean) => {
        const config = await readConfig()
        const password = readServerAccess(config.content).password
        const token = password ? hashServerPassword(password) : null
        tokenRef.current = token

        setState(current => ({
            ...current,
            config,
            configDraft: replaceDraft || !current.configDirty ? config.content : current.configDraft,
            configDirty: replaceDraft ? false : current.configDirty,
            serverAuthToken: token,
        }))
    }, [])

    const syncConfig = React.useCallback(async () => {
        try {
            await refreshConfig(true)
        }
        catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to read config.toml")
        }
    }, [refreshConfig])

    React.useEffect(() => {
        let cancelled = false

        async function load() {
            try {
                const status = await getStatus()
                if (cancelled) return

                let config: ConfigFileResult | null = null
                let configError: unknown = null
                try {
                    config = await readConfig()
                }
                catch (error) {
                    configError = error
                }

                const password = config ? readServerAccess(config.content).password : ""
                const token = password ? hashServerPassword(password) : null
                tokenRef.current = token

                setState(current => ({
                    ...current,
                    nativeStatus: status,
                    config: config ?? current.config,
                    configDraft: config?.content ?? current.configDraft,
                    configDirty: config ? false : current.configDirty,
                    serverAuthToken: token,
                    reachability: { ...current.reachability, checking: true },
                }))

                if (configError) {
                    toast.error(configError instanceof Error ? configError.message : "Failed to read config.toml")
                }

                const reachability = await fetchServerStatus(status.url, token)
                if (!cancelled) {
                    setState(current => ({ ...current, reachability }))
                }
            }
            catch (error) {
                if (!cancelled) {
                    toast.error(error instanceof Error ? error.message : "Failed to load server state")
                }
            }
        }

        load()
        const interval = setInterval(() => {
            refreshStatus(true).catch(error => {
                setState(current => ({
                    ...current,
                    reachability: {
                        ...current.reachability,
                        reachable: false,
                        error: error instanceof Error ? error.message : "Refresh failed",
                    },
                }))
            })
        }, 2500)

        return () => {
            cancelled = true
            clearInterval(interval)
        }
    }, [refreshStatus])

    const updateDraft = React.useCallback((content: string) => {
        setState(current => ({
            ...current,
            configDraft: content,
            configDirty: content !== current.config?.content,
        }))
    }, [])

    const run = React.useCallback(async (operation: () => Promise<void>) => {
        setState(current => ({ ...current, busy: true }))
        try {
            await tickHaptic()
            await operation()
        }
        catch (error) {
            toast.error(error instanceof Error ? error.message : "Operation failed")
        }
        finally {
            setState(current => ({ ...current, busy: false }))
        }
    }, [])

    const request = React.useCallback(async <T = any>(
        endpoint: string,
        options?: {
            method?: "GET" | "POST" | "PUT" | "DELETE"
            body?: any
            signal?: AbortSignal
        },
    ): Promise<SeaResponse<T>> => {
        const baseUrl = state.nativeStatus?.url ?? `http://127.0.0.1:${SERVER_PORT}`
        const url = `${baseUrl}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`

        const headers: Record<string, string> = {
            "Accept": "application/json",
        }
        if (options?.body) {
            headers["Content-Type"] = "application/json"
        }
        if (tokenRef.current) {
            headers["X-Seanime-Token"] = tokenRef.current
        }

        const fetchOptions: RequestInit = {
            method: options?.method ?? "GET",
            headers,
            signal: options?.signal,
        }
        if (options?.body) {
            fetchOptions.body = JSON.stringify(options.body)
        }

        const response = await fetch(url, fetchOptions)
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData?.error ?? `HTTP ${response.status}`)
        }

        return await response.json()
    }, [state.nativeStatus?.url])

    const start = React.useCallback(() => run(async () => {
        startTraceRef.current = { scope: "server-start", startedAt: Date.now(), attempts: 0 }
        appendOfflineLog("info", "server-start", [`requested port=${SERVER_PORT}`], true)
        try {
            await startServer({ port: SERVER_PORT })
            appendOfflineLog("info", "server-start", ["native start returned"], true)
            await refreshStatus()
            toast.success("WeebHub Mobile Server started")
        }
        catch (error) {
            startTraceRef.current = null
            appendOfflineLog("error", "server-start", [error], true)
            throw error
        }
    }), [refreshStatus, run])

    const stop = React.useCallback(() => run(async () => {
        startTraceRef.current = null
        await stopServer()
        toast.success("WeebHub Mobile Server stopped")
    }), [run])

    const restart = React.useCallback(() => run(async () => {
        appendOfflineLog("info", "server-restart", [`requested port=${SERVER_PORT}`], true)
        try {
            await stopServer()
            await new Promise(resolve => setTimeout(resolve, 1000))
            startTraceRef.current = { scope: "server-restart", startedAt: Date.now(), attempts: 0 }
            await startServer({ port: SERVER_PORT })
            appendOfflineLog("info", "server-restart", ["native restart returned"], true)
            await refreshStatus()
            toast.success("WeebHub Mobile Server restarted")
        }
        catch (error) {
            startTraceRef.current = null
            appendOfflineLog("error", "server-restart", [error], true)
            throw error
        }
    }), [refreshStatus, run])

    const saveConfig = React.useCallback(() => run(async () => {
        const validation = validateConfigToml(state.configDraft)
        if (!validation.valid) {
            throw new Error(validation.message ?? "config.toml is invalid.")
        }

        await writeConfig(state.configDraft)
        await refreshConfig(true)
        toast.success("config.toml saved")

        const isRunning = Boolean(state.nativeStatus?.isRunning || state.reachability.reachable)
        if (isRunning) {
            Alert.alert(
                "Restart Server",
                "The server needs to be restarted for the changes to be applied. Would you like to restart it now?",
                [
                    { text: "Later", style: "cancel" },
                    {
                        text: "Restart Now",
                        onPress: () => {
                            restart()
                        },
                    },
                ],
            )
        }
    }), [refreshConfig, run, state.configDraft, state.nativeStatus?.isRunning, state.reachability.reachable, restart])

    const saveLan = React.useCallback((lan: boolean, password: string) => run(async () => {
        const content = setServerAccess(state.configDraft, lan, password)
        const validation = validateConfigToml(content)
        if (!validation.valid) {
            throw new Error(validation.message ?? "config.toml is invalid.")
        }

        await writeConfig(content)
        await refreshConfig(true)
        toast.success(lan ? "Remote Access enabled" : "Remote Access disabled")

        const isRunning = Boolean(state.nativeStatus?.isRunning || state.reachability.reachable)
        if (isRunning) {
            Alert.alert(
                "Restart Server",
                "The server needs to be restarted for this change to take effect.",
                [
                    { text: "Later", style: "cancel" },
                    { text: "Restart Now", onPress: restart },
                ],
            )
        }
    }), [refreshConfig, restart, run, state.configDraft, state.nativeStatus?.isRunning, state.reachability.reachable])

    const reloadConfig = React.useCallback(() => run(async () => {
        await refreshConfig(true)
        toast.success("Changes discarded")
    }), [refreshConfig, run])

    const restoreConfig = React.useCallback(() => run(async () => {
        await resetConfig()
        await refreshConfig(true)
        toast.success("config.toml reset to mobile defaults")
    }), [refreshConfig, run])

    const setDir = React.useCallback((path: string, copy: boolean) => run(async () => {
        const result = await setDataDir(path, copy)
        await refreshStatus()
        await refreshConfig(true)
        toast.success(
            result.copied
                ? `Copied ${result.copiedFiles.toLocaleString()} files and changed the data directory`
                : "Data directory changed",
        )
    }), [refreshConfig, refreshStatus, run])

    const copyUrl = React.useCallback(() => {
        const url = state.nativeStatus?.url
        if (!url) return
        copyToClipboard(url)
        toast.success("Server URL copied")
    }, [state.nativeStatus?.url])

    const toggleStartOnBoot = React.useCallback((enabled: boolean) => run(async () => {
        await setStartOnBoot(enabled)
        await refreshStatus()
        toast.success(enabled ? "Start on boot enabled" : "Start on boot disabled")
    }), [refreshStatus, run])

    const requestNotifications = React.useCallback(() => run(async () => {
        await requestNotificationPermission()
        await refreshStatus()
    }), [refreshStatus, run])

    const openBatterySettings = React.useCallback(() => {
        openBatteryOptimizationSettings()
    }, [])

    const openStorageSettings = React.useCallback(() => {
        openManageExternalStorageSettings()
    }, [])

    const openSettings = React.useCallback(() => {
        openAppSettings()
    }, [])

    const setupServer = React.useCallback(async (anilistToken: string, libraryPath: string) => {
        setState(current => ({ ...current, busy: true }))
        try {
            await tickHaptic()
            const res = await request("/api/v1/start", {
                method: "POST",
                body: {
                    library: {
                        libraryPath: libraryPath,
                        libraryPaths: [],
                        torrentProvider: "",
                        enableOnlinestream: true,
                    },
                    mediaPlayer: {
                        defaultPlayer: "mpv",
                    },
                    torrent: {
                        defaultTorrentClient: "seanime",
                    },
                    anilist: {
                        token: anilistToken,
                    },
                    manga: {
                        enabled: true,
                    },
                    enableTranscode: false,
                    enableTorrentStreaming: true,
                },
            })

            if (res.error) throw new Error(res.error)

            toast.success("Setup complete!")
            await refreshStatus()
            await refreshConfig(true)
        }
        catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to save settings")
        }
        finally {
            setState(current => ({ ...current, busy: false }))
        }
    }, [request, refreshStatus, refreshConfig])

    const loginToAnilist = React.useCallback(async (anilistToken: string) => {
        setState(current => ({ ...current, busy: true }))
        try {
            await tickHaptic()
            const res = await request("/api/v1/auth/login", {
                method: "POST",
                body: { token: anilistToken },
            })

            if (res.error) throw new Error(res.error)

            toast.success("Logged in to AniList")
            await refreshStatus()
        }
        catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to log in to AniList")
        }
        finally {
            setState(current => ({ ...current, busy: false }))
        }
    }, [request, refreshStatus])

    const logoutFromAnilist = React.useCallback(async () => {
        setState(current => ({ ...current, busy: true }))
        try {
            await tickHaptic()
            const res = await request("/api/v1/auth/logout", {
                method: "POST",
            })

            if (res.error) throw new Error(res.error)

            toast.success("Logged out of AniList")
            await refreshStatus()
        }
        catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to log out of AniList")
        }
        finally {
            setState(current => ({ ...current, busy: false }))
        }
    }, [request, refreshStatus])

    const isOffline = React.useMemo(() => {
        if (state.reachability.reachable) {
            return state.reachability.offline
        }
        return extractServerOffline(state.configDraft)
    }, [state.reachability.reachable, state.reachability.offline, state.configDraft])

    const lanAccess = React.useMemo(() => readServerAccess(state.configDraft), [state.configDraft])

    const toggleOffline = React.useCallback(async (enabled: boolean) => {
        if (state.reachability.reachable) {
            await run(async () => {
                const res = await request("/api/v1/local/offline", {
                    method: "POST",
                    body: { enabled },
                })
                if (res.error) throw new Error(res.error)

                toast.success(enabled ? "Offline mode activated" : "Offline mode deactivated")
                await refreshStatus()
                await refreshConfig(true)
            })
        } else {
            await run(async () => {
                const newToml = setOfflineInToml(state.configDraft, enabled)
                await writeConfig(newToml)
                await refreshConfig(true)
                toast.success(enabled ? "Offline mode enabled" : "Offline mode disabled")
            })
        }
    }, [state.reachability.reachable, state.configDraft, request, run, refreshStatus, refreshConfig])

    return {
        ...state,
        isOffline,
        lanAccess,
        toggleOffline,
        request,
        start,
        stop,
        restart,
        saveConfig,
        saveLan,
        reloadConfig,
        restoreConfig,
        setDir,
        copyUrl,
        updateDraft,
        refreshStatus,
        syncConfig,
        toggleStartOnBoot,
        requestNotifications,
        openBatterySettings,
        openStorageSettings,
        openSettings,
        setupServer,
        loginToAnilist,
        logoutFromAnilist,
    }
}
