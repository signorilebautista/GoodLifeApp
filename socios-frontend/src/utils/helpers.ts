/**
 * Format a date string to a readable format
 */
export const formatDate = (date: string | Date): string => {
    const d = new Date(date)
    return d.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })
}

/**
 * Format time to HH:MM format
 */
export const formatTime = (date: string | Date): string => {
    const d = new Date(date)
    return d.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
    })
}

/**
 * Calculate duration between two dates in minutes
 */
export const calculateDuration = (start: string | Date, end: string | Date): number => {
    const startDate = new Date(start)
    const endDate = new Date(end)
    return Math.floor((endDate.getTime() - startDate.getTime()) / 1000 / 60)
}

/**
 * Format currency
 */
export const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS'
    }).format(amount)
}

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
}

/**
 * Generate a random ID
 */
export const generateId = (): string => {
    return Math.random().toString(36).substring(2) + Date.now().toString(36)
}
