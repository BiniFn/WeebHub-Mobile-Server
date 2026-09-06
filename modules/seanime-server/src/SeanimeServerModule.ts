import { requireOptionalNativeModule } from "expo-modules-core"
import type { SeanimeServerNativeModule } from "./SeanimeServer.types"

const SeanimeServerModule = requireOptionalNativeModule<SeanimeServerNativeModule>("SeanimeServer")

export default SeanimeServerModule
