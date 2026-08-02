export interface TabataSettings {
    prepare: number
    work: number
    rest: number
    rounds: number
    series: number
    restBetweenSeries: number
}

export const defaultTabataSettings: TabataSettings = {
    prepare: 10,
    work: 20,
    rest: 10,
    rounds: 8,
    series: 1,
    restBetweenSeries: 30,
}

export function loadTabataSettings(): TabataSettings {
    const savedSettings = localStorage.getItem('tabataSettings')
    if (!savedSettings) return defaultTabataSettings
    try {
        const parsed = JSON.parse(savedSettings)
        return {
            prepare: parsed.prepare || defaultTabataSettings.prepare,
            work: parsed.work || defaultTabataSettings.work,
            rest: parsed.rest || defaultTabataSettings.rest,
            rounds: parsed.rounds || defaultTabataSettings.rounds,
            series: parsed.series || defaultTabataSettings.series,
            restBetweenSeries: parsed.restBetweenSeries || defaultTabataSettings.restBetweenSeries,
        }
    } catch {
        return defaultTabataSettings
    }
}
