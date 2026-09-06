# Upstream Tracking

- **Upstream mobile wrapper:** https://github.com/5rahim/seanime-server-mobile
- **Current local upstream snapshot:** `1081583b6468a51a6dee83f931ea65d0390c365a`
- **Upstream server:** https://github.com/5rahim/seanime
- **Fork:** https://github.com/BiniFn/WeebHub-Mobile-Server

## WeebHub deviations

- WeebHub Mobile Server name, package metadata, deep link scheme, logo, documentation, and app-facing strings.
- WeebHub release lookup and Tenji handoff links.
- BiniFn maintenance credits while preserving Seanime attribution and GPL-3.0 notices.

## Compatibility identifiers

The native module folder, Go artifact filename, native module symbol, and iOS framework still use upstream `seanime`/`SeanimeCore` identifiers. They are compatibility identifiers, not user-facing branding. Rename them only in a coordinated native migration with all Android, iOS, Go, and TypeScript callers.

## Future synchronization

Merge upstream changes through a dedicated branch, review native/mobile API changes, retain legal notices, and test Android and iOS builds before release.
