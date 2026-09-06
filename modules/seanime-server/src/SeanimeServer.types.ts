export type SeanimeServerState = "stopped" | "starting" | "running" | "stopping" | "error"

export type AndroidPermissionStatus = {
    notificationGranted: boolean
    batteryOptimizationIgnored: boolean
    manageExternalStorageGranted: boolean
}

export type SeanimeServerStatus = {
    state: SeanimeServerState
    isRunning: boolean
    keepAliveActive: boolean
    url: string
    host: string
    port: number
    dataDir: string
    internalDataDir: string
    suggestedDataDir: string | null
    usingCustomDataDir: boolean
    cacheDir: string
    configPath: string
    configExists: boolean
    startOnBoot: boolean
    canStopWithoutExiting: boolean
    startedAt: number | null
    lastError: string | null
    android: AndroidPermissionStatus | null
}

export type StartServerOptions = {
    port?: number
}

export type ConfigFileResult = {
    path: string
    content: string
    exists: boolean
}

export type DataDirResult = {
    previousDataDir: string
    dataDir: string
    copied: boolean
    copiedFiles: number
    copiedBytes: number
}

export type SeanimeServerNativeModule = {
    startServer(options?: StartServerOptions): Promise<SeanimeServerStatus>
    stopServer(): Promise<SeanimeServerStatus>
    getStatus(): Promise<SeanimeServerStatus>
    readConfig(): Promise<ConfigFileResult>
    writeConfig(content: string): Promise<ConfigFileResult>
    resetConfig(): Promise<ConfigFileResult>
    setDataDir(path: string, copy: boolean): Promise<DataDirResult>
    copyToClipboard(text: string): boolean
    setStartOnBoot(enabled: boolean): Promise<SeanimeServerStatus>
    requestNotificationPermission(): Promise<SeanimeServerStatus>
    openBatteryOptimizationSettings(): boolean
    openManageExternalStorageSettings(): boolean
    openAppSettings(): boolean
}
