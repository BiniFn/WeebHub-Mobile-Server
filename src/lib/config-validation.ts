import { SERVER_PORT } from "@/lib/constants"

export type ConfigValidation = {
    valid: boolean
    message: string | null
}

function readTomlString(content: string, key: string) {
    const match = new RegExp(`^${key}\\s*=\\s*['"]([^'"]*)['"]`, "m").exec(content)
    return match?.[1]?.trim() ?? ""
}

function readTomlNumber(content: string, key: string) {
    const match = new RegExp(`^${key}\\s*=\\s*(\\d+)`, "m").exec(content)
    return match ? Number(match[1]) : Number.NaN
}

export function validateConfigToml(content: string): ConfigValidation {
    const trimmed = content.trim()

    if (!trimmed) {
        return { valid: false, message: "config.toml cannot be empty." }
    }

    if (!trimmed.includes("[server]")) {
        return { valid: false, message: "config.toml must include a [server] section." }
    }

    const host = readTomlString(content, "host")
    if (!host) {
        return { valid: false, message: "server.host must be set." }
    }

    const port = readTomlNumber(content, "port")
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
        return { valid: false, message: "server.port must be between 1 and 65535." }
    }

    if (port !== SERVER_PORT) {
        return { valid: true, message: `Saved config uses port ${port}. The mobile wrapper still starts Seanime on ${SERVER_PORT}.` }
    }

    return { valid: true, message: null }
}
