import AsyncStorage from '@react-native-async-storage/async-storage'
import { Directory, File, Paths } from 'expo-file-system'
import { Expense, ExpenseCategory, ExpenseInput, EXPENSE_CATEGORIES } from '../models/Expense'

const EXPENSES_KEY = '@FinanLocal:expenses'
const RECEIPTS_DIRECTORY = new Directory(Paths.document, 'receipts')

function isExpenseCategory(value: unknown): value is ExpenseCategory {
    return typeof value === 'string' && EXPENSE_CATEGORIES.includes(value as ExpenseCategory)
}

function isExpense(value: unknown): value is Expense {
    if (!value || typeof value !== 'object') return false

    const expense = value as Record<string, unknown>
    return (
        typeof expense.id === 'string' &&
        typeof expense.description === 'string' &&
        typeof expense.amount === 'number' &&
        Number.isFinite(expense.amount) &&
        isExpenseCategory(expense.category) &&
        typeof expense.date === 'string' &&
        typeof expense.receiptUri === 'string' &&
        (typeof expense.latitude === 'number' || expense.latitude === null) &&
        (typeof expense.longitude === 'number' || expense.longitude === null) &&
        typeof expense.createdAt === 'string'
    )
}

function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'erro desconhecido'
}

export class ReceiptCleanupError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'ReceiptCleanupError'
    }
}

export class ExpenseRepository {
    async getAll(): Promise<Expense[]> {
        const raw = await AsyncStorage.getItem(EXPENSES_KEY)
        if (raw === null) return []

        let parsed: unknown
        try {
            parsed = JSON.parse(raw)
        } catch (error) {
            throw new Error(`Os dados das despesas estão inválidos. ${getErrorMessage(error)}`)
        }

        if (!Array.isArray(parsed) || !parsed.every(isExpense)) {
            throw new Error('Os dados salvos das despesas estão em um formato inválido.')
        }
        return parsed
    }

    async create(input: ExpenseInput): Promise<Expense> {
        if (!input.receiptSourceUri) {
            throw new Error('Tire uma foto do comprovante antes de salvar a despesa.')
        }

        const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
        const sourceFile = new File(input.receiptSourceUri)
        if (!sourceFile.exists) {
            throw new Error('A foto do comprovante não está mais disponível. Tire outra foto.')
        }

        if (!RECEIPTS_DIRECTORY.exists) {
            RECEIPTS_DIRECTORY.create({ idempotent: true, intermediates: true })
        }

        const receiptFile = new File(RECEIPTS_DIRECTORY, `${id}.jpg`)
        try {
            await sourceFile.copy(receiptFile)
        } catch (error) {
            throw new Error(`Não foi possível guardar a foto do comprovante. ${getErrorMessage(error)}`)
        }

        const expense: Expense = {
            id,
            description: input.description,
            amount: input.amount,
            category: input.category,
            date: input.date,
            receiptUri: receiptFile.uri,
            latitude: input.latitude,
            longitude: input.longitude,
            createdAt: new Date().toISOString(),
        }

        try {
            const expenses = await this.getAll()
            await AsyncStorage.setItem(EXPENSES_KEY, JSON.stringify([expense, ...expenses]))
        } catch (error) {
            try {
                if (receiptFile.exists) receiptFile.delete()
            } catch (cleanupError) {
                throw new Error(
                    `Não foi possível salvar a despesa (${getErrorMessage(error)}) nem remover a cópia da foto (${getErrorMessage(cleanupError)}).`,
                )
            }
            throw new Error(`Não foi possível salvar a despesa. ${getErrorMessage(error)}`)
        }

        return expense
    }

    async remove(id: string): Promise<void> {
        const expenses = await this.getAll()
        const expense = expenses.find((item) => item.id === id)
        if (!expense) throw new Error('A despesa selecionada não foi encontrada.')

        await AsyncStorage.setItem(
            EXPENSES_KEY,
            JSON.stringify(expenses.filter((item) => item.id !== id)),
        )

        const receiptFile = new File(expense.receiptUri)
        try {
            if (receiptFile.exists) receiptFile.delete()
        } catch (error) {
            throw new ReceiptCleanupError(
                `A despesa foi removida, mas o arquivo do comprovante não pôde ser excluído. ${getErrorMessage(error)}`,
            )
        }
    }
}

export const expenseRepository = new ExpenseRepository()
