export const LOOPBACK_HOST = "127.0.0.1"
export const LAN_HOST = "0.0.0.0"

export type ServerAccess = {
    host: string
    password: string
    lan: boolean
}

function getSection(lines: string[]) {
    const start = lines.findIndex(line => /^\s*\[server\]\s*(?:#.*)?$/.test(line))
    if (start === -1) {
        return null
    }

    const next = lines.findIndex((line, index) => index > start && /^\s*\[[^\]]+\]\s*(?:#.*)?$/.test(line))
    return {
        start,
        end: next === -1 ? lines.length : next,
    }
}

function readValue(lines: string[], start: number, end: number, key: string) {
    const pattern = new RegExp(`^\\s*${key}\\s*=\\s*`)

    for (let index = start + 1; index < end; index += 1) {
        const match = pattern.exec(lines[index])
        if (!match) continue

        const value = lines[index].slice(match[0].length).trim()
        if (value.startsWith("'")) {
            const close = value.indexOf("'", 1)
            return close === -1 ? "" : value.slice(1, close)
        }
        if (value.startsWith("\"")) {
            for (let offset = 1; offset < value.length; offset += 1) {
                if (value[offset] !== "\"") continue

                let escapes = 0
                for (let previous = offset - 1; previous >= 0 && value[previous] === "\\"; previous -= 1) {
                    escapes += 1
                }
                if (escapes % 2 !== 0) continue

                try {
                    return JSON.parse(value.slice(0, offset + 1)) as string
                }
                catch {
                    return value.slice(1, offset)
                }
            }
        }
    }

    return ""
}

function setValue(lines: string[], start: number, end: number, key: string, value: string) {
    const pattern = new RegExp(`^(\\s*)${key}\\s*=`)

    for (let index = start + 1; index < end; index += 1) {
        const match = pattern.exec(lines[index])
        if (match) {
            lines[index] = `${match[1]}${key} = ${JSON.stringify(value)}`
            return end
        }
    }

    lines.splice(end, 0, `${key} = ${JSON.stringify(value)}`)
    return end + 1
}

export function readServerAccess(toml: string): ServerAccess {
    const lines = toml.split(/\r?\n/)
    const section = getSection(lines)
    if (!section) {
        return { host: LOOPBACK_HOST, password: "", lan: false }
    }

    const host = readValue(lines, section.start, section.end, "host") || LOOPBACK_HOST
    const password = readValue(lines, section.start, section.end, "password")

    return {
        host,
        password,
        lan: host === LAN_HOST,
    }
}

export function setServerAccess(toml: string, lan: boolean, password: string) {
    const cleanPassword = password.trim()
    if (lan && !cleanPassword) {
        throw new Error("A password is required before allowing LAN connections.")
    }

    const newline = toml.includes("\r\n") ? "\r\n" : "\n"
    const lines = toml.split(/\r?\n/)
    const section = getSection(lines)
    if (!section) {
        throw new Error("config.toml must include a [server] section.")
    }

    let end = setValue(lines, section.start, section.end, "host", lan ? LAN_HOST : LOOPBACK_HOST)
    end = setValue(lines, section.start, end, "password", cleanPassword)
    if (lan) {
        setValue(lines, section.start, end, "secureMode", "")
    }

    return lines.join(newline)
}
