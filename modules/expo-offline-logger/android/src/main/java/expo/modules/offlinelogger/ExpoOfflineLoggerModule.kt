package expo.modules.offlinelogger

import android.app.ActivityManager
import android.app.ApplicationExitInfo
import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.os.Build
import android.os.Handler
import android.os.Looper
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.concurrent.atomic.AtomicBoolean
import kotlin.system.exitProcess

object ExpoOfflineLoggerRuntime {
    @Volatile
    private var installed = false
    @Volatile
    private var watchdogThread: Thread? = null
    @Volatile
    private var lastAnrWriteAt = 0L
    private var previousHandler: Thread.UncaughtExceptionHandler? = null
    private const val ANR_TIMEOUT_MS = 5000L
    private const val ANR_WRITE_THROTTLE_MS = 30000L
    private const val PREFS_NAME = "expo-offline-logger"
    private const val CLEARED_EXIT_AT_KEY = "cleared-exit-at"

    private fun directory(context: Context): File {
        return File(context.filesDir, "seanime-server-offline-logger").apply { mkdirs() }
    }

    private fun logsFile(context: Context): File {
        return File(directory(context), "native.log")
    }

    private fun crashFile(context: Context): File {
        return File(directory(context), "last-native-crash.log")
    }

    private fun timestamp(): String {
        return SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSSZ", Locale.US).format(Date())
    }

    fun install(context: Context): Boolean {
        if (installed) return false

        previousHandler = Thread.getDefaultUncaughtExceptionHandler()
        Thread.setDefaultUncaughtExceptionHandler { thread, throwable ->
            writeCrash(context, thread, throwable)

            val handler = previousHandler
            if (handler != null) {
                handler.uncaughtException(thread, throwable)
            } else {
                exitProcess(2)
            }
        }

        installed = true
        startAnrWatchdog(context.applicationContext)
        return true
    }

    fun append(context: Context, entryJson: String) {
        logsFile(context).appendText(entryJson + "\n")
    }

    fun readNativeLogs(context: Context): String? {
        val file = logsFile(context)
        return if (file.exists()) file.readText() else null
    }

    fun getLastNativeCrash(context: Context): String? {
        val file = crashFile(context)
        return if (file.exists()) file.readText() else null
    }

    fun getLastProcessExit(context: Context): String? {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) return null

        return runCatching {
            val manager = context.getSystemService(ActivityManager::class.java)
            val clearedAt = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                .getLong(CLEARED_EXIT_AT_KEY, 0L)
            val exit = manager.getHistoricalProcessExitReasons(context.packageName, 0, 5)
                .firstOrNull { it.timestamp > clearedAt }
                ?: return@runCatching null

            buildString {
                appendLine("timestamp=${formatTimestamp(exit.timestamp)}")
                appendLine("reason=${exitReason(exit.reason)}")
                appendLine("status=${exit.status}")
                appendLine("importance=${exit.importance}")
                appendLine("pssKb=${exit.pss}")
                appendLine("rssKb=${exit.rss}")
                appendLine("process=${exit.processName}")
                val description = exit.description
                if (!description.isNullOrBlank()) {
                    appendLine("description=${description.replace('\n', ' ')}")
                }
            }.trimEnd()
        }.getOrNull()
    }

    fun clear(context: Context) {
        logsFile(context).delete()
    }

    fun clearLastNativeCrash(context: Context) {
        crashFile(context).delete()
    }

    fun clearLastProcessExit(context: Context) {
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .edit()
            .putLong(CLEARED_EXIT_AT_KEY, System.currentTimeMillis())
            .apply()
    }

    private fun writeCrash(context: Context, thread: Thread, throwable: Throwable) {
        val crash = buildString {
            appendLine("timestamp=${timestamp()}")
            appendLine("thread=${thread.name}")
            appendLine("type=${throwable::class.java.name}")
            appendLine("message=${throwable.message ?: ""}")
            appendLine(throwable.stackTraceToString())
        }

        crashFile(context).writeText(crash)
    }

    private fun formatTimestamp(value: Long): String {
        return SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSSZ", Locale.US).format(Date(value))
    }

    private fun exitReason(reason: Int): String {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            if (reason == ApplicationExitInfo.REASON_PACKAGE_STATE_CHANGE) return "package-state-change"
            if (reason == ApplicationExitInfo.REASON_PACKAGE_UPDATED) return "package-updated"
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU && reason == ApplicationExitInfo.REASON_FREEZER) {
            return "freezer"
        }

        return when (reason) {
            ApplicationExitInfo.REASON_EXIT_SELF -> "exit-self"
            ApplicationExitInfo.REASON_SIGNALED -> "signaled"
            ApplicationExitInfo.REASON_LOW_MEMORY -> "low-memory"
            ApplicationExitInfo.REASON_CRASH -> "java-crash"
            ApplicationExitInfo.REASON_CRASH_NATIVE -> "native-crash"
            ApplicationExitInfo.REASON_ANR -> "anr"
            ApplicationExitInfo.REASON_INITIALIZATION_FAILURE -> "initialization-failure"
            ApplicationExitInfo.REASON_PERMISSION_CHANGE -> "permission-change"
            ApplicationExitInfo.REASON_EXCESSIVE_RESOURCE_USAGE -> "excessive-resource-usage"
            ApplicationExitInfo.REASON_USER_REQUESTED -> "user-requested"
            ApplicationExitInfo.REASON_USER_STOPPED -> "user-stopped"
            ApplicationExitInfo.REASON_DEPENDENCY_DIED -> "dependency-died"
            ApplicationExitInfo.REASON_OTHER -> "other"
            else -> "unknown"
        }
    }

    private fun startAnrWatchdog(context: Context) {
        if (watchdogThread != null) return

        val mainHandler = Handler(Looper.getMainLooper())
        watchdogThread = Thread {
            while (!Thread.currentThread().isInterrupted) {
                val responded = AtomicBoolean(false)
                mainHandler.post { responded.set(true) }

                try {
                    Thread.sleep(ANR_TIMEOUT_MS)
                } catch (_: InterruptedException) {
                    return@Thread
                }

                if (!responded.get()) {
                    writeAnr(context)
                }
            }
        }.apply {
            name = "WeebHubMobileServerAnrWatchdog"
            isDaemon = true
            start()
        }
    }

    private fun writeAnr(context: Context) {
        val now = System.currentTimeMillis()
        if (now - lastAnrWriteAt < ANR_WRITE_THROTTLE_MS) return
        lastAnrWriteAt = now

        val mainThread = Looper.getMainLooper().thread
        val stack = mainThread.stackTrace.joinToString("\n") { frame -> "  at $frame" }
        val crash = buildString {
            appendLine("timestamp=${timestamp()}")
            appendLine("type=android-anr")
            appendLine("thread=${mainThread.name}")
            appendLine(stack)
        }

        crashFile(context).writeText(crash)
    }
}

class ExpoOfflineLoggerModule : Module() {
    private val context
        get() = requireNotNull(appContext.reactContext)

    override fun definition() = ModuleDefinition {
        Name("ExpoOfflineLogger")

        Function("install") {
            ExpoOfflineLoggerRuntime.install(context)
        }

        Function("append") { entryJson: String ->
            ExpoOfflineLoggerRuntime.append(context, entryJson)
        }

        AsyncFunction("readNativeLogs") { promise: Promise ->
            promise.resolve(ExpoOfflineLoggerRuntime.readNativeLogs(context))
        }

        AsyncFunction("getLastNativeCrash") { promise: Promise ->
            promise.resolve(ExpoOfflineLoggerRuntime.getLastNativeCrash(context))
        }

        AsyncFunction("getLastProcessExit") { promise: Promise ->
            promise.resolve(ExpoOfflineLoggerRuntime.getLastProcessExit(context))
        }

        Function("clear") {
            ExpoOfflineLoggerRuntime.clear(context)
        }

        Function("clearLastNativeCrash") {
            ExpoOfflineLoggerRuntime.clearLastNativeCrash(context)
        }

        Function("clearLastProcessExit") {
            ExpoOfflineLoggerRuntime.clearLastProcessExit(context)
        }

        Function("copyToClipboard") { text: String ->
            val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
            clipboard.setPrimaryClip(ClipData.newPlainText("WeebHub Mobile Server logs", text))
            true
        }
    }
}
