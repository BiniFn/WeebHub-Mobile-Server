import Toast from "react-native-toast-message"

export const toast = {
    success: (message: string) => {
        Toast.show({
            type: "success",
            position: "top",
            text2: message,
            visibilityTime: 2000,
            topOffset: 50,
        })
    },
    error: (message: string) => {
        Toast.show({
            type: "error",
            position: "top",
            text2: message,
            visibilityTime: 2500,
            topOffset: 50,
        })
    },
    info: (message: string) => {
        Toast.show({
            type: "info",
            position: "top",
            text2: message,
            visibilityTime: 2000,
            topOffset: 50,
        })
    },
    warning: (message: string) => {
        Toast.show({
            type: "warning",
            position: "top",
            text2: message,
            visibilityTime: 2500,
            topOffset: 50,
        })
    },
}
