import { useEffect, useState } from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import ExpenseForm from './src/components/ExpenseForm'
import ExpenseList from './src/components/ExpenseList'
import { Expense, ExpenseInput } from './src/models/Expense'
import { expenseRepository, ReceiptCleanupError } from './src/storage/ExpenseRepository'

function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Ocorreu um erro inesperado.'
}

function sortExpenses(items: Expense[]): Expense[] {
    return [...items].sort((first, second) =>
        second.date.localeCompare(first.date) ||
        second.createdAt.localeCompare(first.createdAt),
    )
}

function AppContent() {
    const [expenses, setExpenses] = useState<Expense[]>([])
    const [loading, setLoading] = useState(true)
    const [formVisible, setFormVisible] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let active = true

        expenseRepository.getAll().then((items) => {
            if (active) setExpenses(sortExpenses(items))
        }).catch((loadError: unknown) => {
            if (active) setError(`Não foi possível carregar suas despesas. ${getErrorMessage(loadError)}`)
        }).finally(() => {
            if (active) setLoading(false)
        })

        return () => {
            active = false
        }
    }, [])

    async function saveExpense(input: ExpenseInput): Promise<void> {
        setError(null)
        const savedExpense = await expenseRepository.create(input)
        setExpenses((current) => sortExpenses([savedExpense, ...current]))
        setFormVisible(false)
    }

    async function deleteExpense(id: string): Promise<void> {
        setError(null)
        try {
            await expenseRepository.remove(id)
            setExpenses((current) => current.filter((expense) => expense.id !== id))
        } catch (deleteError) {
            if (deleteError instanceof ReceiptCleanupError) {
                setExpenses((current) => current.filter((expense) => expense.id !== id))
            }
            setError(getErrorMessage(deleteError))
            throw deleteError
        }
    }

    const totalInCents = expenses.reduce((sum, expense) => sum + Math.round(expense.amount * 100), 0)
    const total = (totalInCents / 100).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    })

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar style="dark" />
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                <View style={styles.header}>
                    <View style={styles.brandMark}>
                        <Text style={styles.brandMarkText}>F</Text>
                    </View>
                    <View>
                        <Text style={styles.brandName}>FinanLocal</Text>
                        <Text style={styles.tagline}>Suas despesas, sob controle.</Text>
                    </View>
                </View>

                <View style={styles.summaryCard}>
                    <Text style={styles.summaryLabel}>Total das despesas</Text>
                    <Text style={styles.summaryTotal}>{total}</Text>
                    <Text style={styles.summaryCount}>
                        {expenses.length === 1 ? '1 despesa registrada' : `${expenses.length} despesas registradas`}
                    </Text>
                </View>

                <View style={styles.sectionHeading}>
                    <View>
                        <Text style={styles.sectionTitle}>Nova despesa</Text>
                        <Text style={styles.sectionSubtitle}>Registre um gasto e guarde o comprovante.</Text>
                    </View>
                    <Text
                        accessibilityRole="button"
                        onPress={() => setFormVisible((visible) => !visible)}
                        style={styles.toggleButton}
                    >
                        {formVisible ? 'Fechar' : '＋ Adicionar'}
                    </Text>
                </View>

                {formVisible && !loading && <ExpenseForm onSave={saveExpense} />}

                <View style={styles.sectionHeading}>
                    <View>
                        <Text style={styles.sectionTitle}>Histórico</Text>
                        <Text style={styles.sectionSubtitle}>Suas despesas salvas neste aparelho.</Text>
                    </View>
                </View>

                {error && (
                    <View accessibilityRole="alert" style={styles.errorBanner}>
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                )}

                {loading ? (
                    <View style={styles.loading}>
                        <ActivityIndicator color="#16794b" />
                        <Text style={styles.loadingText}>Carregando despesas…</Text>
                    </View>
                ) : (
                    <ExpenseList expenses={expenses} onDelete={deleteExpense} />
                )}

                <Text style={styles.footer}>Seus dados ficam armazenados localmente neste aparelho.</Text>
            </ScrollView>
        </SafeAreaView>
    )
}

export default function App() {
    return (
        <SafeAreaProvider>
            <AppContent />
        </SafeAreaProvider>
    )
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f4f7f5',
    },
    content: {
        width: '100%',
        maxWidth: 720,
        alignSelf: 'center',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 22,
    },
    brandMark: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: '#16794b',
        justifyContent: 'center',
        alignItems: 'center',
    },
    brandMarkText: {
        color: '#ffffff',
        fontSize: 26,
        fontWeight: '800',
    },
    brandName: {
        color: '#163c2b',
        fontSize: 22,
        fontWeight: '800',
    },
    tagline: {
        color: '#718078',
        fontSize: 13,
        marginTop: 2,
    },
    summaryCard: {
        backgroundColor: '#16794b',
        borderRadius: 22,
        padding: 22,
        marginBottom: 28,
    },
    summaryLabel: {
        color: '#d8f1e2',
        fontSize: 14,
    },
    summaryTotal: {
        color: '#ffffff',
        fontSize: 34,
        fontWeight: '800',
        marginTop: 8,
    },
    summaryCount: {
        color: '#d8f1e2',
        fontSize: 13,
        marginTop: 4,
    },
    sectionHeading: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 14,
        marginTop: 4,
    },
    sectionTitle: {
        color: '#183b2c',
        fontSize: 20,
        fontWeight: '700',
    },
    sectionSubtitle: {
        color: '#76827b',
        fontSize: 13,
        marginTop: 4,
    },
    toggleButton: {
        color: '#16794b',
        fontSize: 14,
        fontWeight: '700',
        paddingVertical: 10,
        paddingLeft: 12,
    },
    errorBanner: {
        backgroundColor: '#fff0ed',
        borderColor: '#f2b5a9',
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        marginBottom: 14,
    },
    errorText: {
        color: '#9e3020',
        fontSize: 13,
        lineHeight: 19,
    },
    loading: {
        minHeight: 90,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    loadingText: {
        color: '#718078',
        fontSize: 14,
    },
    footer: {
        color: '#89958e',
        fontSize: 12,
        lineHeight: 18,
        textAlign: 'center',
        marginTop: 26,
    },
})
