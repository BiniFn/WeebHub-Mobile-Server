import { SERVER_PORT } from "@/lib/constants"
import * as Network from "expo-network"
import * as React from "react"

export type LanAddress = {
    ip: string | null
    url: string | null
    loading: boolean
    message: string | null
}

const initialAddress: LanAddress = {
    ip: null,
    url: null,
    loading: true,
    message: null,
}

function canRead(type: Network.NetworkStateType) {
    return type !== Network.NetworkStateType.NONE && type !== Network.NetworkStateType.CELLULAR
}

export function useLanAddress(): LanAddress {
    const network = Network.useNetworkState()
    const [address, setAddress] = React.useState(initialAddress)

    React.useEffect(() => {
        let active = true

        if (!network.type) return () => { active = false }

        if (!canRead(network.type)) {
            setAddress({
                ip: null,
                url: null,
                loading: false,
                message: "Connect this device to Wi-Fi or Ethernet to get a private IP address.",
            })
            return () => { active = false }
        }

        setAddress(current => ({ ...current, loading: true, message: null }))

        void Network.getIpAddressAsync()
            .then(ip => {
                if (!active) return

                if (!ip || ip === "0.0.0.0") {
                    setAddress({
                        ip: null,
                        url: null,
                        loading: false,
                        message: "The private IP address is not available. Check this device's network settings.",
                    })
                    return
                }

                setAddress({
                    ip,
                    url: `http://${ip}:${SERVER_PORT}`,
                    loading: false,
                    message: null,
                })
            })
            .catch(() => {
                if (!active) return
                setAddress({
                    ip: null,
                    url: null,
                    loading: false,
                    message: "The private IP address could not be read on this device.",
                })
            })

        return () => { active = false }
    }, [network.isConnected, network.type])

    return address
}
