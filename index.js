import { registerRootComponent } from "expo"
import { ExpoRoot } from "expo-router"
import { installOfflineLogger } from "./src/lib/offline-logger"

installOfflineLogger()

export function App() {
    const ctx = require.context("./app")
    return <ExpoRoot context={ctx} />
}

registerRootComponent(App)
