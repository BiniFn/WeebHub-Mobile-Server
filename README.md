<p align="center">
  <a href="https://weebhub-pearl.vercel.app">
    <img src="assets/weebhub-logo-v2.png" alt="WeebHub logo" width="112" />
  </a>
</p>

<h1 align="center">WeebHub Mobile Server</h1>

<p align="center">
  Run the WeebHub backend locally on a supported Android or iOS device.
</p>

<p align="center">
  <a href="https://github.com/BiniFn/WeebHub">WeebHub Server</a> ·
  <a href="https://github.com/BiniFn/WeebHub-Tenji">WeebHub Tenji</a> ·
  <a href="https://github.com/BiniFn/WeebHub-Mobile-Server/releases">Releases</a>
</p>

## About

WeebHub Mobile Server is the mobile backend component of the WeebHub ecosystem. It starts a local WeebHub server at `http://127.0.0.1:43211` so WeebHub Tenji can use library management, playback, downloads, manga features, and supported server functionality directly on a mobile device.

It includes Android foreground-service and wake-lock support for long-running work, plus iOS keep-alive behavior where the platform permits it. Mobile OS background restrictions still apply.

WeebHub Mobile Server does not provide, host, or distribute media. You are responsible for using legally obtained media and complying with local law.

## Features

- Local WeebHub server on Android (iOS build coming soon)
- Android foreground-service, wake-lock, notification, boot, and storage controls
- iOS background/keep-alive integration where supported
- Local Tenji connectivity through `http://127.0.0.1:43211`
- Library, extension, torrent, download, manga, and configuration access through the server UI
- LAN configuration and local data-directory management

## Development

```bash
git clone https://github.com/BiniFn/WeebHub-Mobile-Server.git
cd WeebHub-Mobile-Server
npm install
npx tsc --noEmit
```

Use `npm run dev:android` or `npm run dev:ios` for device development. Building the embedded server requires the WeebHub Go source and `gomobile`; see [CONTRIBUTING.md](CONTRIBUTING.md) for development details.

## Credits and Fork Attribution

**Maintained and branded by BiniFn.**

WeebHub Mobile Server is a modified fork of [Seanime Server Mobile](https://github.com/5rahim/seanime-server-mobile), based on the [Seanime](https://github.com/5rahim/seanime) server created by 5rahim and contributors. The original authors retain credit for upstream architecture, native server bindings, and included upstream code. WeebHub-specific branding, integration, and changes are maintained by BiniFn.

## License

WeebHub Mobile Server is licensed under the [GNU General Public License v3.0](LICENSE). Preserve the upstream notices and see [CONTRIBUTING.md](CONTRIBUTING.md) for source-build requirements.
