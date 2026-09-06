import AVFoundation
import Darwin
import ExpoModulesCore
import Foundation
import SeanimeCore
import UIKit

private enum SeanimeServerRuntime {
  static let host = "127.0.0.1"
  static let defaultPort = 43211

  private static let lock = NSLock()
  private static var state = "stopped"
  private static var port = defaultPort
  private static var startedAt: Double?
  private static var lastError: String?
  private static var startOnBoot = false
  private static var serverStarted = false
  private static var audioPlayer: AVAudioPlayer?

  private static var dataDirURL: URL {
    FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first!
  }

  private static var cacheDirURL: URL {
    FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask).first!
  }

  private static var configURL: URL {
    dataDirURL.appendingPathComponent("config.toml")
  }

  static func start(requestedPort: Int) throws -> [String: Any] {
    try ensureConfigFile()
    setState("starting", error: nil)
    port = requestedPort
    startedAt = Date().timeIntervalSince1970 * 1000

    try startSilentAudio()

    lock.lock()
    let shouldStartServer = !serverStarted
    if shouldStartServer {
      serverStarted = true
    }
    lock.unlock()

    if shouldStartServer {
      DispatchQueue.global(qos: .background).async {
        MobileStartServer(dataDirURL.path, cacheDirURL.path, requestedPort)
        setState("running", error: nil)
      }
    } else {
      setState("running", error: nil)
    }

    return status()
  }

  static func stop() -> [String: Any] {
    setState("stopping", error: nil)
    stopSilentAudio()
    setState("stopped", error: nil)
    startedAt = nil

    DispatchQueue.main.async {
      UIApplication.shared.perform(#selector(URLSessionTask.suspend))
    }

    DispatchQueue.main.asyncAfter(deadline: .now() + 0.8) {
      exit(0)
    }

    return status()
  }

  static func status() -> [String: Any] {
    let currentState = state
    let running = currentState == "running" || currentState == "starting"
    let configExists = FileManager.default.fileExists(atPath: configURL.path)
    let startedAtValue: Any = startedAt.map { value in value as Any } ?? NSNull()
    let lastErrorValue: Any = lastError.map { value in value as Any } ?? NSNull()

    return [
      "state": currentState,
      "isRunning": running,
      "keepAliveActive": audioPlayer?.isPlaying == true,
      "url": "http://\(host):\(port)",
      "host": host,
      "port": port,
      "dataDir": dataDirURL.path,
      "internalDataDir": dataDirURL.path,
      "suggestedDataDir": NSNull(),
      "usingCustomDataDir": false,
      "cacheDir": cacheDirURL.path,
      "configPath": configURL.path,
      "configExists": configExists,
      "startOnBoot": startOnBoot,
      "canStopWithoutExiting": false,
      "startedAt": startedAtValue,
      "lastError": lastErrorValue,
      "android": NSNull()
    ]
  }

  static func readConfig() throws -> [String: Any] {
    try ensureConfigFile()
    return [
      "path": configURL.path,
      "content": try String(contentsOf: configURL, encoding: .utf8),
      "exists": FileManager.default.fileExists(atPath: configURL.path)
    ]
  }

  static func writeConfig(_ content: String) throws -> [String: Any] {
    try FileManager.default.createDirectory(at: dataDirURL, withIntermediateDirectories: true)
    try content.write(to: configURL, atomically: true, encoding: .utf8)
    return try readConfig()
  }

  static func resetConfig() throws -> [String: Any] {
    try writeConfig(defaultConfig)
  }

  static func copyToClipboard(_ text: String) -> Bool {
    UIPasteboard.general.string = text
    return true
  }

  static func setStartOnBoot(_ enabled: Bool) -> [String: Any] {
    startOnBoot = false
    return status()
  }

  static func openAppSettings() -> Bool {
    guard let url = URL(string: UIApplication.openSettingsURLString) else {
      return false
    }
    DispatchQueue.main.async {
      UIApplication.shared.open(url)
    }
    return true
  }

  static func openBatteryOptimizationSettings() -> Bool {
    openAppSettings()
  }

  static func openManageExternalStorageSettings() -> Bool {
    openAppSettings()
  }

  private static func setState(_ nextState: String, error: String?) {
    lock.lock()
    state = nextState
    lastError = error
    lock.unlock()
  }

  private static func ensureConfigFile() throws {
    try FileManager.default.createDirectory(at: dataDirURL, withIntermediateDirectories: true)
    if !FileManager.default.fileExists(atPath: configURL.path) {
      try defaultConfig.write(to: configURL, atomically: true, encoding: .utf8)
    }
  }

  private static func startSilentAudio() throws {
    try AVAudioSession.sharedInstance().setCategory(.playback, mode: .default, options: [.mixWithOthers])
    try AVAudioSession.sharedInstance().setActive(true)

    let audioURL = cacheDirURL.appendingPathComponent("seanime-server-silence.wav")
    if !FileManager.default.fileExists(atPath: audioURL.path) {
      try FileManager.default.createDirectory(at: cacheDirURL, withIntermediateDirectories: true)
      try silentWavData().write(to: audioURL)
    }

    let player = try AVAudioPlayer(contentsOf: audioURL)
    player.numberOfLoops = -1
    player.volume = 0.0
    player.prepareToPlay()
    player.play()
    audioPlayer = player
  }

  private static func stopSilentAudio() {
    audioPlayer?.stop()
    audioPlayer = nil
    try? AVAudioSession.sharedInstance().setActive(false, options: [.notifyOthersOnDeactivation])
  }

  private static func silentWavData() -> Data {
    var data = Data()
    let sampleRate: UInt32 = 8000
    let channels: UInt16 = 1
    let bitsPerSample: UInt16 = 16
    let durationSeconds: UInt32 = 1
    let blockAlign = channels * bitsPerSample / 8
    let byteRate = sampleRate * UInt32(blockAlign)
    let dataSize = sampleRate * durationSeconds * UInt32(blockAlign)

    appendAscii("RIFF", to: &data)
    appendUInt32(36 + dataSize, to: &data)
    appendAscii("WAVE", to: &data)
    appendAscii("fmt ", to: &data)
    appendUInt32(16, to: &data)
    appendUInt16(1, to: &data)
    appendUInt16(channels, to: &data)
    appendUInt32(sampleRate, to: &data)
    appendUInt32(byteRate, to: &data)
    appendUInt16(blockAlign, to: &data)
    appendUInt16(bitsPerSample, to: &data)
    appendAscii("data", to: &data)
    appendUInt32(dataSize, to: &data)
    data.append(Data(repeating: 0, count: Int(dataSize)))
    return data
  }

  private static func appendAscii(_ value: String, to data: inout Data) {
    data.append(value.data(using: .ascii)!)
  }

  private static func appendUInt16(_ value: UInt16, to data: inout Data) {
    var littleEndian = value.littleEndian
    withUnsafeBytes(of: &littleEndian) { bytes in
      data.append(contentsOf: bytes)
    }
  }

  private static func appendUInt32(_ value: UInt32, to data: inout Data) {
    var littleEndian = value.littleEndian
    withUnsafeBytes(of: &littleEndian) { bytes in
      data.append(contentsOf: bytes)
    }
  }

  private static var defaultConfig: String {
    """
    version = ''

    [server]
    host = '\(host)'
    port = \(defaultPort)
    offline = false
    useBinaryPath = false
    systray = false
    password = ''
    secureMode = 'lax'

    [database]
    name = 'seanime'

    [web]
    assetDir = '$SEANIME_DATA_DIR/assets'

    [logs]
    dir = '$SEANIME_DATA_DIR/logs'

    [cache]
    dir = '$SEANIME_DATA_DIR/cache'
    transcodeDir = '$SEANIME_DATA_DIR/cache/transcode'

    [offline]
    dir = '$SEANIME_DATA_DIR/offline'
    assetDir = '$SEANIME_DATA_DIR/offline/assets'

    [manga]
    downloadDir = '$SEANIME_DATA_DIR/manga'
    localDir = '$SEANIME_DATA_DIR/manga-local'

    [extensions]
    dir = '$SEANIME_DATA_DIR/extensions'

    [experimental]
    builtintorrentclient = true
    """
  }
}

public class SeanimeServerModule: Module {
  public func definition() -> ModuleDefinition {
    Name("SeanimeServer")

    AsyncFunction("startServer") { (options: [String: Int]?) -> [String: Any] in
      try SeanimeServerRuntime.start(requestedPort: options?["port"] ?? SeanimeServerRuntime.defaultPort)
    }

    AsyncFunction("stopServer") { () -> [String: Any] in
      SeanimeServerRuntime.stop()
    }

    AsyncFunction("getStatus") { () -> [String: Any] in
      SeanimeServerRuntime.status()
    }

    AsyncFunction("readConfig") { () -> [String: Any] in
      try SeanimeServerRuntime.readConfig()
    }

    AsyncFunction("writeConfig") { (content: String) -> [String: Any] in
      try SeanimeServerRuntime.writeConfig(content)
    }

    AsyncFunction("resetConfig") { () -> [String: Any] in
      try SeanimeServerRuntime.resetConfig()
    }

    AsyncFunction("setDataDir") { (path: String, copy: Bool) -> [String: Any] in
      _ = path
      _ = copy
      throw NSError(
        domain: "SeanimeServer",
        code: 1,
        userInfo: [NSLocalizedDescriptionKey: "Custom data directories are only supported on Android."]
      )
    }

    Function("copyToClipboard") { (text: String) -> Bool in
      SeanimeServerRuntime.copyToClipboard(text)
    }

    AsyncFunction("setStartOnBoot") { (enabled: Bool) -> [String: Any] in
      SeanimeServerRuntime.setStartOnBoot(enabled)
    }

    AsyncFunction("requestNotificationPermission") { () -> [String: Any] in
      SeanimeServerRuntime.status()
    }

    Function("openBatteryOptimizationSettings") { () -> Bool in
      SeanimeServerRuntime.openBatteryOptimizationSettings()
    }

    Function("openManageExternalStorageSettings") { () -> Bool in
      SeanimeServerRuntime.openManageExternalStorageSettings()
    }

    Function("openAppSettings") { () -> Bool in
      SeanimeServerRuntime.openAppSettings()
    }
  }
}
