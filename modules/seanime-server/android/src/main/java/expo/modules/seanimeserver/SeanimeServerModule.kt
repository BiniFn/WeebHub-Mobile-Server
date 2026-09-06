package expo.modules.seanimeserver

import android.Manifest
import android.os.Build
import expo.modules.interfaces.permissions.PermissionsResponseListener
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class SeanimeServerModule : Module() {
    private val context
        get() = requireNotNull(appContext.reactContext)

    override fun definition() = ModuleDefinition {
        Name("SeanimeServer")

        AsyncFunction("startServer") { options: Map<String, Any?>?, promise: Promise ->
            try {
                val port = when (val value = options?.get("port")) {
                    is Number -> value.toInt()
                    else -> SeanimeServerRuntime.defaultPort
                }
                promise.resolve(SeanimeServerRuntime.start(context, port))
            } catch (error: Exception) {
                promise.reject("SEANIME_START_FAILED", error.message ?: "Failed to start Seanime Server", error)
            }
        }

        AsyncFunction("stopServer") { promise: Promise ->
            val activity = appContext.currentActivity
            activity?.finishAndRemoveTask()
            promise.resolve(SeanimeServerRuntime.stop(context, true))
        }

        AsyncFunction("getStatus") { promise: Promise ->
            promise.resolve(SeanimeServerRuntime.status(context))
        }

        AsyncFunction("readConfig") { promise: Promise ->
            promise.resolve(SeanimeServerRuntime.readConfig(context))
        }

        AsyncFunction("writeConfig") { content: String, promise: Promise ->
            promise.resolve(SeanimeServerRuntime.writeConfig(context, content))
        }

        AsyncFunction("resetConfig") { promise: Promise ->
            promise.resolve(SeanimeServerRuntime.resetConfig(context))
        }

        AsyncFunction("setDataDir") { path: String, copy: Boolean, promise: Promise ->
            try {
                promise.resolve(SeanimeServerRuntime.setDataDir(context, path, copy))
            } catch (error: Exception) {
                promise.reject(
                    "SEANIME_DATA_DIR_FAILED",
                    error.message ?: "Failed to change the data directory",
                    error
                )
            }
        }

        Function("copyToClipboard") { text: String ->
            SeanimeServerRuntime.copyToClipboard(context, text)
        }

        AsyncFunction("setStartOnBoot") { enabled: Boolean, promise: Promise ->
            promise.resolve(SeanimeServerRuntime.setStartOnBoot(context, enabled))
        }

        AsyncFunction("requestNotificationPermission") { promise: Promise ->
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
                promise.resolve(SeanimeServerRuntime.status(context))
                return@AsyncFunction
            }

            val permissions = appContext.permissions
            if (permissions == null) {
                promise.reject("SEANIME_PERMISSION_UNAVAILABLE", "Expo permissions service is unavailable", null)
                return@AsyncFunction
            }

            permissions.askForPermissions(
                PermissionsResponseListener {
                    promise.resolve(SeanimeServerRuntime.status(context))
                },
                Manifest.permission.POST_NOTIFICATIONS
            )
        }

        Function("openBatteryOptimizationSettings") {
            SeanimeServerRuntime.openBatteryOptimizationSettings(context)
        }

        Function("openManageExternalStorageSettings") {
            SeanimeServerRuntime.openManageExternalStorageSettings(context)
        }

        Function("openAppSettings") {
            SeanimeServerRuntime.openAppSettings(context)
        }
    }
}
