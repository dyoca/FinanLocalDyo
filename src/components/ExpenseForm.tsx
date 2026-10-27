import { useRef, useState } from 'react'
import {
    ActivityIndicator,
    Image,
    Linking,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { ExpenseCategory, ExpenseInput, EXPENSE_CATEGORIES } from '../models/Expense'
import { useCurrentLocation } from '../hooks/useCurrentLocation'

type Props = {
    onSave: (expense: ExpenseInput) => Promise<void>
}

export default function ExpenseForm({ onSave }: Props) {
    const [description, setDescription] = useState('')
    const [amount, setAmount] = useState('')
    const [category, setCategory] = useState<ExpenseCategory>('Alimentação')
    const [date, setDate] = useState(new Date().toLocaleDateString('pt-BR'))
    const [photo, setPhoto] = useState<string | null>(null)
    const [cameraOpen, setCameraOpen] = useState(false)
    const [cameraReady, setCameraReady] = useState(false)
    const [cameraError, setCameraError] = useState('')
    const [formError, setFormError] = useState('')
    const [saving, setSaving] = useState(false)
    const [permission, askCameraPermission] = useCameraPermissions()
    const camera = useRef<CameraView>(null)
    const location = useCurrentLocation()

    async function openCamera() {
        setCameraError('')
        setCameraReady(false)

        try {
            if (!permission?.granted) {
                const result = await askCameraPermission()
                if (!result.granted) {
                    if (result.canAskAgain) {
                        setCameraError('Permita o acesso à câmera para fotografar o comprovante.')
                    } else {
                        setCameraError('A câmera foi bloqueada. Ative a permissão nas configurações.')
                    }
                    return
                }
            }

            setCameraOpen(true)
        } catch {
            setCameraError('Não foi possível abrir a câmera.')
        }
    }

    async function takePhoto() {
        if (!camera.current || !cameraReady) return

        try {
            const result = await camera.current.takePictureAsync({ quality: 0.8 })
            if (!result.uri) {
                setCameraError('A câmera não conseguiu tirar a foto. Tente novamente.')
                return
            }
            setPhoto(result.uri)
            setCameraOpen(false)
            setCameraError('')
        } catch {
            setCameraError('Não foi possível tirar a foto. Tente novamente.')
        }
    }

    async function openSettings() {
        try {
            await Linking.openSettings()
        } catch {
            setCameraError('Não foi possível abrir as configurações.')
        }
    }

    async function saveExpense() {
        setFormError('')

        const price = Number(amount.replace(',', '.'))
        const dateParts = date.split('/')
        let validDate = dateParts.length === 3 &&
            dateParts[0].length === 2 &&
            dateParts[1].length === 2 &&
            dateParts[2].length === 4

        if (validDate) {
            const day = Number(dateParts[0])
            const month = Number(dateParts[1])
            const year = Number(dateParts[2])
            const checkedDate = new Date(year, month - 1, day)
            validDate = checkedDate.getDate() === day &&
                checkedDate.getMonth() === month - 1 &&
                checkedDate.getFullYear() === year
        }

        if (!description.trim()) {
            setFormError('Digite a descrição da despesa.')
            return
        }
        if (isNaN(price) || price <= 0) {
            setFormError('Digite um valor válido.')
            return
        }
        if (!validDate) {
            setFormError('Digite a data no formato DD/MM/AAAA.')
            return
        }
        if (!photo) {
            setFormError('Tire uma foto do comprovante.')
            return
        }

        setSaving(true)
        try {
            await onSave({
                description: description.trim(),
                amount: price,
                category,
                date: `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`,
                receiptSourceUri: photo,
                latitude: location.coordinates?.latitude ?? null,
                longitude: location.coordinates?.longitude ?? null,
            })
        } catch (error) {
            setFormError(error instanceof Error ? error.message : 'Não foi possível salvar.')
        } finally {
            setSaving(false)
        }
    }

    return (
        <View style={styles.card}>
            <Text style={styles.label}>Descrição</Text>
            <TextInput
                onChangeText={setDescription}
                placeholder="Ex.: Almoço"
                style={styles.input}
                value={description}
            />

            <View style={styles.row}>
                <View style={styles.column}>
                    <Text style={styles.label}>Valor (R$)</Text>
                    <TextInput
                        keyboardType="decimal-pad"
                        onChangeText={setAmount}
                        placeholder="0,00"
                        style={styles.input}
                        value={amount}
                    />
                </View>
                <View style={styles.column}>
                    <Text style={styles.label}>Data</Text>
                    <TextInput
                        keyboardType="numbers-and-punctuation"
                        maxLength={10}
                        onChangeText={setDate}
                        placeholder="DD/MM/AAAA"
                        style={styles.input}
                        value={date}
                    />
                </View>
            </View>

            <Text style={styles.label}>Categoria</Text>
            <View style={styles.row}>
                {EXPENSE_CATEGORIES.map((item) => (
                    <Pressable
                        key={item}
                        onPress={() => setCategory(item)}
                        style={[styles.category, category === item && styles.selectedCategory]}
                    >
                        <Text style={styles.categoryText}>{item}</Text>
                    </Pressable>
                ))}
            </View>

            <Text style={styles.label}>Comprovante</Text>
            {cameraOpen ? (
                <View style={styles.cameraBox}>
                    <CameraView
                        ref={camera}
                        facing="back"
                        style={styles.camera}
                        onCameraReady={() => setCameraReady(true)}
                        onMountError={() => {
                            setCameraError('A câmera não iniciou. Tente novamente.')
                            setCameraOpen(false)
                        }}
                    />
                    <View style={styles.cameraButtons}>
                        <Pressable onPress={() => setCameraOpen(false)}>
                            <Text style={styles.buttonText}>Cancelar</Text>
                        </Pressable>
                        <Pressable
                            disabled={!cameraReady}
                            onPress={takePhoto}
                            style={styles.shutter}
                        >
                            <Text style={styles.shutterText}>●</Text>
                        </Pressable>
                    </View>
                </View>
            ) : photo ? (
                <View style={styles.photoRow}>
                    <Image source={{ uri: photo }} style={styles.photo} />
                    <Pressable onPress={openCamera}>
                        <Text style={styles.link}>Tirar outra foto</Text>
                    </Pressable>
                </View>
            ) : (
                <Pressable onPress={openCamera} style={styles.outlineButton}>
                    <Text style={styles.link}>Abrir câmera</Text>
                </Pressable>
            )}

            {cameraError !== '' && (
                <View style={styles.errorBox}>
                    <Text style={styles.error}>{cameraError}</Text>
                    {permission && !permission.granted && !permission.canAskAgain && (
                        <Pressable onPress={openSettings}>
                            <Text style={styles.link}>Abrir configurações</Text>
                        </Pressable>
                    )}
                </View>
            )}

            <Text style={styles.label}>Localização</Text>
            <Pressable
                disabled={location.loading}
                onPress={() => location.getLocation()}
                style={styles.outlineButton}
            >
                {location.loading
                    ? <ActivityIndicator color="#16794b" />
                    : <Text style={styles.link}>
                        {location.coordinates ? 'Atualizar localização' : 'Obter localização GPS'}
                    </Text>}
            </Pressable>
            {location.coordinates && (
                <Text style={styles.success}>
                    {location.coordinates.latitude.toFixed(5)}, {location.coordinates.longitude.toFixed(5)}
                </Text>
            )}
            {location.error !== null && <Text style={styles.error}>{location.error}</Text>}
            <Text style={styles.helpText}>A localização é opcional. Você pode salvar sem GPS.</Text>

            {formError !== '' && <Text style={styles.error}>{formError}</Text>}

            <Pressable
                disabled={saving}
                onPress={saveExpense}
                style={styles.saveButton}
            >
                {saving
                    ? <ActivityIndicator color="#ffffff" />
                    : <Text style={styles.saveText}>Salvar despesa</Text>}
            </Pressable>
        </View>
    )
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
    },
    label: {
        color: '#30463a',
        fontWeight: '700',
        marginBottom: 7,
        marginTop: 12,
    },
    input: {
        borderColor: '#dce5df',
        borderWidth: 1,
        borderRadius: 10,
        padding: 12,
        color: '#20372b',
    },
    row: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    column: {
        flex: 1,
    },
    category: {
        borderColor: '#dce5df',
        borderWidth: 1,
        borderRadius: 18,
        padding: 9,
    },
    selectedCategory: {
        backgroundColor: '#e8f5ed',
        borderColor: '#16794b',
    },
    categoryText: {
        color: '#30463a',
        fontSize: 12,
    },
    outlineButton: {
        minHeight: 44,
        borderWidth: 1,
        borderColor: '#16794b',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    link: {
        color: '#16794b',
        fontWeight: '700',
    },
    cameraBox: {
        height: 220,
        overflow: 'hidden',
        borderRadius: 10,
        backgroundColor: '#222222',
    },
    camera: {
        flex: 1,
    },
    cameraButtons: {
        position: 'absolute',
        bottom: 10,
        left: 15,
        right: 15,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    buttonText: {
        color: '#ffffff',
        fontWeight: '700',
    },
    shutter: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#ffffff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    shutterText: {
        color: '#16794b',
        fontSize: 28,
    },
    photoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    photo: {
        width: 65,
        height: 65,
        borderRadius: 8,
    },
    errorBox: {
        padding: 10,
        backgroundColor: '#fff0ed',
        borderRadius: 8,
        gap: 6,
        marginTop: 8,
    },
    error: {
        color: '#983b2d',
        fontSize: 13,
        marginTop: 6,
    },
    success: {
        color: '#16794b',
        marginTop: 8,
        fontSize: 13,
    },
    helpText: {
        color: '#7c8881',
        fontSize: 12,
        marginTop: 7,
    },
    saveButton: {
        minHeight: 48,
        backgroundColor: '#16794b',
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
    },
    saveText: {
        color: '#ffffff',
        fontWeight: '700',
    },
})
