import { useState } from 'react'
import {
    Alert,
    Image,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native'
import { Expense, formatExpenseDate } from '../models/Expense'

type ExpenseListProps = {
    expenses: Expense[]
    onDelete: (id: string) => Promise<void>
}

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
})

export default function ExpenseList({ expenses, onDelete }: ExpenseListProps) {
    const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    function confirmDelete(expense: Expense) {
        Alert.alert(
            'Excluir despesa?',
            'A despesa e o arquivo do comprovante serão removidos deste aparelho.',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Excluir',
                    style: 'destructive',
                    onPress: () => {
                        setDeletingId(expense.id)
                        void onDelete(expense.id)
                            .catch(() => undefined)
                            .finally(() => setDeletingId(null))
                    },
                },
            ],
        )
    }

    if (expenses.length === 0) {
        return (
            <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>Seu histórico começa aqui</Text>
                <Text style={styles.emptyText}>Adicione uma despesa para acompanhar seus gastos.</Text>
            </View>
        )
    }

    return (
        <View style={styles.list}>
            {expenses.map((expense) => (
                <View key={expense.id} style={styles.card}>
                    <View style={styles.cardTop}>
                        <View style={styles.expenseDetails}>
                            <Text style={styles.description}>{expense.description}</Text>
                            <View style={styles.metaRow}>
                                <Text style={styles.category}>{expense.category}</Text>
                                <Text style={styles.dot}>·</Text>
                                <Text style={styles.date}>{formatExpenseDate(expense.date)}</Text>
                            </View>
                        </View>
                        <Text style={styles.amount}>{currencyFormatter.format(expense.amount)}</Text>
                    </View>

                    <View style={styles.cardBottom}>
                        <View style={styles.receiptLocation}>
                            <Pressable
                                accessibilityRole="button"
                                onPress={() => setSelectedReceipt(expense.receiptUri)}
                                style={styles.receiptLink}
                            >
                                <Image source={{ uri: expense.receiptUri }} style={styles.receiptThumbnail} />
                                <Text style={styles.receiptText}>Ver comprovante</Text>
                            </Pressable>
                            <Text style={styles.locationText}>
                                {expense.latitude !== null && expense.longitude !== null
                                    ? `${expense.latitude.toFixed(4)}, ${expense.longitude.toFixed(4)}`
                                    : 'Localização não registrada'}
                            </Text>
                        </View>
                        <Pressable
                            accessibilityRole="button"
                            disabled={deletingId === expense.id}
                            onPress={() => confirmDelete(expense)}
                            style={styles.deleteButton}
                        >
                            <Text style={styles.deleteText}>
                                {deletingId === expense.id ? 'Excluindo…' : 'Excluir'}
                            </Text>
                        </Pressable>
                    </View>
                </View>
            ))}

            <Modal
                animationType="fade"
                onRequestClose={() => setSelectedReceipt(null)}
                transparent
                visible={selectedReceipt !== null}
            >
                <View style={styles.modalBackdrop}>
                    <Pressable
                        accessibilityRole="button"
                        onPress={() => setSelectedReceipt(null)}
                        style={styles.modalClose}
                    >
                        <Text style={styles.modalCloseText}>Fechar</Text>
                    </Pressable>
                    {selectedReceipt && (
                        <Image
                            resizeMode="contain"
                            source={{ uri: selectedReceipt }}
                            style={styles.fullReceipt}
                        />
                    )}
                </View>
            </Modal>
        </View>
    )
}

const styles = StyleSheet.create({
    list: {
        gap: 12,
    },
    card: {
        backgroundColor: '#ffffff',
        borderColor: '#e5ece7',
        borderWidth: 1,
        borderRadius: 16,
        padding: 15,
    },
    cardTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    expenseDetails: {
        flex: 1,
    },
    description: {
        color: '#243a2e',
        fontSize: 16,
        fontWeight: '700',
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
        marginTop: 6,
    },
    category: {
        color: '#438360',
        fontSize: 12,
        fontWeight: '700',
    },
    dot: {
        color: '#9aa59e',
    },
    date: {
        color: '#7c8881',
        fontSize: 12,
    },
    amount: {
        color: '#176a43',
        fontSize: 15,
        fontWeight: '800',
    },
    cardBottom: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderTopColor: '#edf1ee',
        borderTopWidth: 1,
        marginTop: 13,
        paddingTop: 11,
        gap: 8,
    },
    receiptLocation: {
        flex: 1,
        gap: 8,
    },
    receiptLink: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    receiptThumbnail: {
        width: 34,
        height: 34,
        borderRadius: 6,
        backgroundColor: '#e8eee9',
    },
    receiptText: {
        color: '#16794b',
        fontSize: 12,
        fontWeight: '700',
    },
    locationText: {
        color: '#7c8881',
        fontSize: 11,
    },
    deleteButton: {
        minHeight: 36,
        justifyContent: 'center',
        paddingHorizontal: 10,
    },
    deleteText: {
        color: '#a43e32',
        fontSize: 12,
        fontWeight: '700',
    },
    emptyCard: {
        backgroundColor: '#ffffff',
        borderColor: '#e5ece7',
        borderWidth: 1,
        borderRadius: 16,
        padding: 22,
        alignItems: 'center',
    },
    emptyTitle: {
        color: '#30463a',
        fontSize: 15,
        fontWeight: '700',
    },
    emptyText: {
        color: '#7c8881',
        fontSize: 13,
        textAlign: 'center',
        marginTop: 7,
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(10,20,14,0.94)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalClose: {
        position: 'absolute',
        zIndex: 1,
        top: 54,
        right: 22,
        padding: 10,
    },
    modalCloseText: {
        color: '#ffffff',
        fontSize: 15,
        fontWeight: '700',
    },
    fullReceipt: {
        width: '100%',
        height: '78%',
    },
})
