package expo.modules.seanimeserver

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.os.Handler
import android.os.Looper
import android.os.PowerManager
import android.provider.Settings
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream
import kotlin.system.exitProcess

object SeanimeServerRuntime {
    const val host = "127.0.0.1"
    const val defaultPort = 43211
    const val actionStart = "app.seanime.server.action.START"
    const val actionStop = "app.seanime.server.action.STOP"
    const val actionOpen = "app.seanime.server.action.OPEN"
    const val extraPort = "port"
    const val extraTerminate = "terminate"
    const val notificationId = 43211
    const val notificationChannelId = "seanime-server"

    private const val prefsName = "seanime-server"
    private const val keyState = "state"
    private const val keyPort = "port"
    private const val keyStartedAt = "startedAt"
    private const val keyLastError = "lastError"
    private const val keyStartOnBoot = "startOnBoot"
    private const val keyDataDir = "dataDir"

    private val defaultConfig = """
version = ''

[server]
host = '$host'
port = $defaultPort
offline = false
useBinaryPath = false
systray = false
password = ''
secureMode = 'lax'

[database]
name = 'seanime'

[web]
assetDir = '${'$'}SEANIME_DATA_DIR/assets'

[logs]
dir = '${'$'}SEANIME_DATA_DIR/logs'

[cache]
dir = '${'$'}SEANIME_DATA_DIR/cache'
transcodeDir = '${'$'}SEANIME_DATA_DIR/cache/transcode'

[offline]
dir = '${'$'}SEANIME_DATA_DIR/offline'
assetDir = '${'$'}SEANIME_DATA_DIR/offline/assets'

[manga]
downloadDir = '${'$'}SEANIME_DATA_DIR/manga'
localDir = '${'$'}SEANIME_DATA_DIR/manga-local'

[extensions]
dir = '${'$'}SEANIME_DATA_DIR/extensions'

[experimental]
builtintorrentclient = true
""".trimIndent() + "\n"

    fun start(context: Context, port: Int = defaultPort): Map<String, Any?> {
        val appContext = context.applicationContext
        ensureConfigFile(appContext)
        setState(appContext, "starting", null)
        prefs(appContext).edit()
            .putInt(keyPort, port)
            .putLong(keyStartedAt, System.currentTimeMillis())
            .apply()

        val intent = Intent(appContext, SeanimeServerService::class.java)
            .setAction(actionStart)
            .putExtra(extraPort, port)

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            appContext.startForegroundService(intent)
        } else {
            appContext.startService(intent)
        }

        return status(appContext)
    }

    fun stop(context: Context, terminate: Boolean = true): Map<String, Any?> {
        val appContext = context.applicationContext
        setState(appContext, "stopping", null)
        val intent = Intent(appContext, SeanimeServerService::class.java)
            .setAction(actionStop)
            .putExtra(extraTerminate, terminate)
        runCatching { appContext.startService(intent) }
        setState(appContext, "stopped", null)
        prefs(appContext).edit().remove(keyStartedAt).apply()

        if (terminate) {
            Handler(Looper.getMainLooper()).postDelayed({
                android.os.Process.killProcess(android.os.Process.myPid())
                exitProcess(0)
            }, 1000)
        }

        return status(appContext)
    }

    fun setRunning(context: Context) {
        setState(context.applicationContext, "running", null)
    }

    fun setError(context: Context, error: Throwable) {
        setState(context.applicationContext, "error", error.message ?: error.javaClass.name)
    }

    fun setStopped(context: Context) {
        val appContext = context.applicationContext
        setState(appContext, "stopped", null)
        prefs(appContext).edit().remove(keyStartedAt).apply()
    }

    fun status(context: Context): Map<String, Any?> {
        val appContext = context.applicationContext
        val preferences = prefs(appContext)
        val port = preferences.getInt(keyPort, defaultPort)
        val state = preferences.getString(keyState, "stopped") ?: "stopped"
        val dataDir = dataDir(appContext)
        val internalDir = internalDir(appContext)
        val configFile = configFile(appContext)

        return mapOf(
            "state" to state,
            "isRunning" to (state == "running" || state == "starting"),
            "keepAliveActive" to (state == "running" || state == "starting"),
            "url" to "http://$host:$port",
            "host" to host,
            "port" to port,
            "dataDir" to dataDir.absolutePath,
            "internalDataDir" to internalDir.absolutePath,
            "suggestedDataDir" to suggestedDir().absolutePath,
            "usingCustomDataDir" to (dataDir != internalDir),
            "cacheDir" to File(dataDir, "cache").absolutePath,
            "configPath" to configFile.absolutePath,
            "configExists" to configFile.exists(),
            "startOnBoot" to preferences.getBoolean(keyStartOnBoot, false),
            "canStopWithoutExiting" to false,
            "startedAt" to preferences.getLong(keyStartedAt, 0L).takeIf { it > 0L },
            "lastError" to preferences.getString(keyLastError, null),
            "android" to mapOf(
                "notificationGranted" to notificationGranted(appContext),
                "batteryOptimizationIgnored" to batteryOptimizationIgnored(appContext),
                "manageExternalStorageGranted" to manageExternalStorageGranted()
            )
        )
    }

    fun readConfig(context: Context): Map<String, Any?> {
        val appContext = context.applicationContext
        val file = ensureConfigFile(appContext)
        return mapOf(
            "path" to file.absolutePath,
            "content" to file.readText(),
            "exists" to file.exists()
        )
    }

    fun writeConfig(context: Context, content: String): Map<String, Any?> {
        val appContext = context.applicationContext
        val file = configFile(appContext)
        file.parentFile?.mkdirs()
        file.writeText(content)
        return readConfig(appContext)
    }

    fun resetConfig(context: Context): Map<String, Any?> {
        return writeConfig(context.applicationContext, defaultConfig)
    }

    @Synchronized
    fun setDataDir(context: Context, path: String, copy: Boolean): Map<String, Any?> {
        val appContext = context.applicationContext
        val state = prefs(appContext).getString(keyState, "stopped") ?: "stopped"
        if (state == "running" || state == "starting" || state == "stopping") {
            error("Stop WeebHub Mobile Server before changing its data directory.")
        }

        val rawPath = path.trim()
        if (rawPath.isEmpty()) {
            error("Data directory cannot be empty.")
        }

        val rawTarget = File(rawPath)
        if (!rawTarget.isAbsolute) {
            error("Data directory must be an absolute path.")
        }

        val current = dataDir(appContext).canonicalFile
        val target = rawTarget.canonicalFile
        if (target.path == File.separator) {
            error("The storage root cannot be used as the data directory.")
        }

        if (target == current) {
            return dataDirResult(current, target, false, CopyStats())
        }

        if (inside(target, current) || inside(current, target)) {
            error("The new data directory cannot contain the current directory or be inside it.")
        }

        prepareDir(target)

        val stats = if (copy) {
            copyDir(current, target)
        } else {
            val config = File(target, "config.toml")
            if (!config.isFile) {
                error("The selected directory does not contain config.toml.")
            }
            CopyStats()
        }

        saveDataDir(appContext, target)
        return dataDirResult(current, target, copy, stats)
    }

    fun copyToClipboard(context: Context, text: String): Boolean {
        val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
        clipboard.setPrimaryClip(ClipData.newPlainText("WeebHub Mobile Server URL", text))
        return true
    }

    fun setStartOnBoot(context: Context, enabled: Boolean): Map<String, Any?> {
        prefs(context.applicationContext).edit().putBoolean(keyStartOnBoot, enabled).apply()
        return status(context)
    }

    fun createNotification(context: Context): android.app.Notification {
        val appContext = context.applicationContext
        ensureNotificationChannel(appContext)

        val launchIntent = appContext.packageManager.getLaunchIntentForPackage(appContext.packageName)
            ?.setAction(actionOpen)
            ?: Intent()
        val openIntent = PendingIntent.getActivity(
            appContext,
            1,
            launchIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        val stopIntent = PendingIntent.getService(
            appContext,
            2,
            Intent(appContext, SeanimeServerService::class.java)
                .setAction(actionStop)
                .putExtra(extraTerminate, true),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            android.app.Notification.Builder(appContext, notificationChannelId)
        } else {
            android.app.Notification.Builder(appContext)
        }

        return builder
            .setContentTitle("WeebHub Mobile Server is running")
            .setContentText("Serving ${status(appContext)["url"]}")
            .setSmallIcon(appContext.applicationInfo.icon)
            .setOngoing(true)
            .setContentIntent(openIntent)
            .addAction(android.R.drawable.ic_menu_close_clear_cancel, "Stop", stopIntent)
            .setCategory(android.app.Notification.CATEGORY_SERVICE)
            .build()
    }

    fun openBatteryOptimizationSettings(context: Context): Boolean {
        val appContext = context.applicationContext
        val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS)
            .setData(Uri.parse("package:${appContext.packageName}"))
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        return startActivity(appContext, intent)
    }

    fun openManageExternalStorageSettings(context: Context): Boolean {
        val appContext = context.applicationContext
        val uri = Uri.parse("package:${appContext.packageName}")
        val intent = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            Intent(Settings.ACTION_MANAGE_APP_ALL_FILES_ACCESS_PERMISSION, uri)
        } else {
            Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, uri)
        }.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        return startActivity(appContext, intent)
    }

    fun openAppSettings(context: Context): Boolean {
        val appContext = context.applicationContext
        val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS)
            .setData(Uri.parse("package:${appContext.packageName}"))
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        return startActivity(appContext, intent)
    }

    fun notificationGranted(context: Context): Boolean {
        return Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU ||
                context.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED
    }

    fun startAfterBoot(context: Context) {
        val appContext = context.applicationContext
        if (prefs(appContext).getBoolean(keyStartOnBoot, false)) {
            runCatching {
                start(appContext, prefs(appContext).getInt(keyPort, defaultPort))
            }.onFailure { error ->
                setError(appContext, error)
            }
        }
    }

    fun acquireWakeLock(context: Context): PowerManager.WakeLock {
        val powerManager = context.getSystemService(Context.POWER_SERVICE) as PowerManager
        return powerManager.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "SeanimeServer:ServerWakeLock").apply {
            setReferenceCounted(false)
            acquire()
        }
    }

    private fun prefs(context: Context) = context.getSharedPreferences(prefsName, Context.MODE_PRIVATE)

    fun dataDir(context: Context): File {
        val appContext = context.applicationContext
        val path = prefs(appContext).getString(keyDataDir, null)
        return if (path.isNullOrBlank()) internalDir(appContext) else normalizedFile(path)
    }

    private fun internalDir(context: Context) = context.filesDir.canonicalFile

    private fun suggestedDir() = File(Environment.getExternalStorageDirectory(), "WeebHub")

    private fun normalizedFile(path: String): File {
        return runCatching { File(path).canonicalFile }.getOrElse { File(path).absoluteFile }
    }

    private fun setState(context: Context, state: String, error: String?) {
        prefs(context).edit()
            .putString(keyState, state)
            .putString(keyLastError, error)
            .apply()
    }

    private fun configFile(context: Context) = File(dataDir(context), "config.toml")

    private fun ensureConfigFile(context: Context): File {
        val file = configFile(context)
        if (!file.exists()) {
            prepareDir(requireNotNull(file.parentFile))
            file.writeText(defaultConfig)
        }
        return file
    }

    private fun prepareDir(dir: File) {
        if (dir.exists() && !dir.isDirectory) {
            error("The selected data path is not a directory.")
        }
        if (!dir.exists() && !dir.mkdirs()) {
            error("Could not create the selected data directory. Check the storage permission and path.")
        }

        val probe = File.createTempFile(".seanime-write-", ".tmp", dir)
        try {
            FileOutputStream(probe).use { output ->
                output.write(1)
                output.fd.sync()
            }
        } finally {
            probe.delete()
        }
    }

    private fun copyDir(source: File, target: File): CopyStats {
        val existing = target.listFiles()
            ?: error("Could not read the selected data directory.")
        if (existing.isNotEmpty()) {
            error("Copy requires an empty directory. Use an empty path or choose 'Use existing data'.")
        }

        val expected = scanDir(source, source)
        val available = target.usableSpace
        if (available > 0 && available < expected.bytes) {
            error("The selected storage does not have enough free space.")
        }

        val parent = target.parentFile ?: error("The selected data directory has no parent folder.")
        val stage = File(parent, ".${target.name}.seanime-copy-${System.currentTimeMillis()}")
        if (stage.exists() || !stage.mkdirs()) {
            error("Could not create a temporary migration directory.")
        }

        try {
            val copied = CopyStats()
            copyFiles(source, stage, source, copied)
            if (copied.files != expected.files || copied.bytes != expected.bytes) {
                error("Data copy verification failed.")
            }

            if (target.listFiles()?.isNotEmpty() == true) {
                error("The selected directory changed during the copy.")
            }
            if (!target.delete()) {
                error("Could not prepare the selected data directory.")
            }
            if (!stage.renameTo(target)) {
                error("Could not finish the data directory switch.")
            }
            return copied
        } catch (error: Throwable) {
            stage.deleteRecursively()
            throw error
        }
    }

    private fun scanDir(dir: File, root: File): CopyStats {
        val stats = CopyStats()
        val children = dir.listFiles() ?: error("Could not read ${dir.absolutePath}.")
        for (child in children) {
            val real = child.canonicalFile
            if (real != child.absoluteFile) {
                error("Links are not supported in the data directory.")
            }
            if (!inside(real, root)) {
                error("Data directory contains a link outside its folder.")
            }
            when {
                child.isDirectory -> stats.add(scanDir(child, root))
                child.isFile -> {
                    stats.files += 1
                    stats.bytes += child.length()
                }

                else -> error("Unsupported file in data directory: ${child.name}")
            }
        }
        return stats
    }

    private fun copyFiles(source: File, target: File, root: File, stats: CopyStats) {
        val children = source.listFiles() ?: error("Could not read ${source.absolutePath}.")
        for (child in children) {
            val real = child.canonicalFile
            if (real != child.absoluteFile) {
                error("Links are not supported in the data directory.")
            }
            if (!inside(real, root)) {
                error("Data directory contains a link outside its folder.")
            }

            val output = File(target, child.name)
            if (child.isDirectory) {
                if (!output.mkdir()) {
                    error("Could not create ${output.absolutePath}.")
                }
                copyFiles(child, output, root, stats)
                output.setLastModified(child.lastModified())
                continue
            }
            if (!child.isFile) {
                error("Unsupported file in data directory: ${child.name}")
            }

            FileInputStream(child).use { input ->
                FileOutputStream(output).use { fileOutput ->
                    input.copyTo(fileOutput)
                    fileOutput.fd.sync()
                }
            }
            if (output.length() != child.length()) {
                error("Copy verification failed for ${child.name}.")
            }
            output.setLastModified(child.lastModified())
            stats.files += 1
            stats.bytes += output.length()
        }
    }

    private fun saveDataDir(context: Context, dir: File) {
        val editor = prefs(context).edit()
        if (dir == internalDir(context)) {
            editor.remove(keyDataDir)
        } else {
            editor.putString(keyDataDir, dir.absolutePath)
        }
        if (!editor.commit()) {
            error("Could not save the selected data directory.")
        }
    }

    private fun dataDirResult(
        previous: File,
        current: File,
        copied: Boolean,
        stats: CopyStats
    ) = mapOf(
        "previousDataDir" to previous.absolutePath,
        "dataDir" to current.absolutePath,
        "copied" to copied,
        "copiedFiles" to stats.files,
        "copiedBytes" to stats.bytes
    )

    private fun inside(file: File, root: File): Boolean {
        val filePath = file.canonicalFile.path
        val rootPath = root.canonicalFile.path
        return filePath == rootPath || filePath.startsWith(rootPath + File.separator)
    }

    private data class CopyStats(
        var files: Int = 0,
        var bytes: Long = 0
    ) {
        fun add(other: CopyStats) {
            files += other.files
            bytes += other.bytes
        }
    }

    private fun ensureNotificationChannel(context: Context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return

        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        if (manager.getNotificationChannel(notificationChannelId) != null) return

        val channel = NotificationChannel(
            notificationChannelId,
            "WeebHub Mobile Server",
            NotificationManager.IMPORTANCE_LOW
        ).apply {
            description = "Keeps the WeebHub Go server alive in the background."
            setShowBadge(false)
        }
        manager.createNotificationChannel(channel)
    }

    private fun batteryOptimizationIgnored(context: Context): Boolean {
        val powerManager = context.getSystemService(Context.POWER_SERVICE) as PowerManager
        return Build.VERSION.SDK_INT < Build.VERSION_CODES.M || powerManager.isIgnoringBatteryOptimizations(context.packageName)
    }

    private fun manageExternalStorageGranted(): Boolean {
        return Build.VERSION.SDK_INT < Build.VERSION_CODES.R || Environment.isExternalStorageManager()
    }

    private fun startActivity(context: Context, intent: Intent): Boolean {
        return runCatching {
            context.startActivity(intent)
            true
        }.getOrDefault(false)
    }
}
