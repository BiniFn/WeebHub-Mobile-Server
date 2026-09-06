export type ExpoOfflineLoggerModuleType = {
    install(): boolean
    append(entryJson: string): void
    readNativeLogs(): Promise<string | null>
    getLastNativeCrash(): Promise<string | null>
    getLastProcessExit?(): Promise<string | null>
    clear(): void
    clearLastNativeCrash(): void
    clearLastProcessExit?(): void
    copyToClipboard(text: string): boolean
}
