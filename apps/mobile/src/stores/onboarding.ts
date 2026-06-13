import { create } from 'zustand'

interface OnboardingStore {
  step: number
  totalSteps: number
  cycleStartDate: string | null
  cycleLength: number
  periodLength: number
  dailyReminder: boolean
  reminderTime: string
  setStep: (step: number) => void
  setCycleData: (startDate: string, length: number, periodLength?: number) => void
  setNotifications: (enabled: boolean, time: string) => void
}

export const useOnboardingStore = create<OnboardingStore>((set) => ({
  step: 1,
  totalSteps: 6,
  cycleStartDate: null,
  cycleLength: 28,
  periodLength: 5,
  dailyReminder: true,
  reminderTime: '08:00',
  setStep: (step) => set({ step }),
  setCycleData: (cycleStartDate, cycleLength, periodLength = 5) =>
    set({ cycleStartDate, cycleLength, periodLength }),
  setNotifications: (dailyReminder, reminderTime) => set({ dailyReminder, reminderTime }),
}))
