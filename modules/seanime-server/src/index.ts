import type { ConfigFileResult, DataDirResult, SeanimeServerStatus, StartServerOptions } from "./SeanimeServer.types"
import SeanimeServerModule from "./SeanimeServerModule"

function requireModule() {
    if (!SeanimeServerModule) {
        throw new Error("SeanimeServer native module is unavailable. Build a development client or native app.")
    }
    return SeanimeServerModule
}

export async function startServer(options?: StartServerOptions): Promise<SeanimeServerStatus> {
    return requireModule().startServer(options)
}

export async function stopServer(): Promise<SeanimeServerStatus> {
    return requireModule().stopServer()
}

export async function getStatus(): Promise<SeanimeServerStatus> {
    return requireModule().getStatus()
}

export async function readConfig(): Promise<ConfigFileResult> {
    return requireModule().readConfig()
}

export async function writeConfig(content: string): Promise<ConfigFileResult> {
    return requireModule().writeConfig(content)
}

export async function resetConfig(): Promise<ConfigFileResult> {
    return requireModule().resetConfig()
}

export async function setDataDir(path: string, copy: boolean): Promise<DataDirResult> {
    return requireModule().setDataDir(path, copy)
}

export function copyToClipboard(text: string): boolean {
    return requireModule().copyToClipboard(text)
}

export async function setStartOnBoot(enabled: boolean): Promise<SeanimeServerStatus> {
    return requireModule().setStartOnBoot(enabled)
}

export async function requestNotificationPermission(): Promise<SeanimeServerStatus> {
    return requireModule().requestNotificationPermission()
}

export function openBatteryOptimizationSettings(): boolean {
    return requireModule().openBatteryOptimizationSettings()
}

export function openManageExternalStorageSettings(): boolean {
    return requireModule().openManageExternalStorageSettings()
}

export function openAppSettings(): boolean {
    return requireModule().openAppSettings()
}

export type {
    AndroidPermissionStatus,
    ConfigFileResult,
    DataDirResult,
    SeanimeServerState,
    SeanimeServerStatus,
    StartServerOptions,
} from "./SeanimeServer.types"
