import { useState } from 'react'
import * as Location from 'expo-location'

export type Coordinates = {
    latitude: number
    longitude: number
}

type LocationState = {
    coordinates: Coordinates | null
    loading: boolean
    error: string | null
}

function getTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('timeout')), timeoutMs)
        promise.then(
            (value) => {
                clearTimeout(timer)
                resolve(value)
            },
            (error: unknown) => {
                clearTimeout(timer)
                reject(error)
            },
        )
    })
}

export function useCurrentLocation() {
    const [state, setState] = useState<LocationState>({
        coordinates: null,
        loading: false,
        error: null,
    })

    async function getLocation(): Promise<Coordinates | null> {
        setState({ coordinates: null, loading: true, error: null })

        try {
            const permission = await Location.requestForegroundPermissionsAsync()
            if (!permission.granted) {
                throw new Error(
                    permission.canAskAgain
                        ? 'A permissão de localização foi negada. Autorize o acesso para registrar o local.'
                        : 'A localização foi bloqueada. Ative a permissão nas configurações do aparelho.',
                )
            }

            const servicesEnabled = await Location.hasServicesEnabledAsync()
            if (!servicesEnabled) {
                throw new Error('O serviço de localização está desligado. Ative o GPS e tente novamente.')
            }

            const position = await getTimeout(
                Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }),
                20000,
            )
            const coordinates = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
            }
            setState({ coordinates, loading: false, error: null })
            return coordinates
        } catch (error) {
            const message = error instanceof Error && error.message !== 'timeout'
                ? error.message
                : error instanceof Error
                    ? 'A localização demorou demais. Verifique o GPS e tente novamente.'
                    : 'Não foi possível obter a localização. Verifique o GPS e tente novamente.'
            setState({ coordinates: null, loading: false, error: message })
            return null
        }
    }

    return { ...state, getLocation }
}
