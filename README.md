<p align="center">
<a href="https://seanime.app/">
<img src="src/assets/images/icon.png" alt="preview" width="70px"/>
</a>
</p>

<h1 align="center"><b>Seanime Server (Mobile)</b></h1>

<p align="center">
  <a href="https://seanime.app/docs">Documentation</a> |
  <a href="https://github.com/5rahim/seanime-server-mobile/releases">Latest release</a> |
  <a href="https://seanime.app/docs/policies">Copyright</a>
</p>

<div align="center">
  <a href="https://github.com/sponsors/5rahim">
    <img src="https://img.shields.io/static/v1?label=Sponsor&style=flat-square&message=%E2%9D%A4&logo=GitHub&color=%23fe8e86" alt="" />
  </a>
</div>

<h5 align="center">
Leave a star if you like the project! ⭐️
</h5>

## About

This is a standalone port of [Seanime](https://github.com/5rahim/seanime) designed to run the server in the background of Android and iOS devices.

By running the server locally (`http://127.0.0.1:43211`), it can serve as the backend engine for the **[Seanime Tenji](https://github.com/5rahim/seanime-tenji)** client app, enabling torrenting,
library management, and more, on your phone.

> [!WARNING]
> This is a highly experimental project. Stability and performance are not guaranteed.

> [!IMPORTANT]
> Seanime does not provide, host, or distribute any media content. Users are responsible for obtaining media through legal means and complying with local laws.

## Features

- **Full Backend**: Contains the entire [Seanime](https://github.com/5rahim/seanime) server running in the background.
- **Wake Lock Protection**: Uses Android CPU partial wake locks to keep downloads running during device standby.
- **iOS Keep-Alive**: Prevents iOS from suspending the server's connection when the app is minimized.

## Development

Seanime Server is built with React Native, Expo, and a custom Seanime server module compiled via `gomobile`.
Detailed guides on setup and local development can be found in the [Contributing Guide](CONTRIBUTING.md).

---

> [!NOTE]
> For copyright policies and contact information, please visit [the website](https://seanime.app/docs/policies).
