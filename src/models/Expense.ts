export const EXPENSE_CATEGORIES = [
    'Alimentação',
    'Transporte',
    'Moradia',
    'Saúde',
    'Lazer',
    'Contas',
    'Compras',
    'Outros',
] as const

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]

export type Expense = {
    id: string
    description: string
    amount: number
    category: ExpenseCategory
    date: string
    receiptUri: string
    latitude: number | null
    longitude: number | null
    createdAt: string
}

export type ExpenseInput = Omit<Expense, 'id' | 'createdAt' | 'receiptUri'> & {
    receiptSourceUri: string
}

export function formatExpenseDate(date: string): string {
    const [year, month, day] = date.split('-')
    return `${day}/${month}/${year}`
}
