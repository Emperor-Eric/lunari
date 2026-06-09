import { create } from 'zustand'

interface OnboardingStore {
  step: number
  totalSteps: number
  cycleStartDate: string | null
  cycleLength: number
  dailyReminder: boolean
  reminderTime: string
  setStep: (step: number) => void
  setCycleData: (startDate: string, length: number) => void
  setNotifications: (enabled: boolean, time: string) => void
}

export const useOnboardingStore = create<OnboardingStore>((set) => ({
  step: 1,
  totalSteps: 6,
  cycleStartDate: null,
  cycleLength: 28,
  dailyReminder: true,
  reminderTime: '08:00',
  setStep: (step) => set({ step }),
  setCycleData: (cycleStartDate, cycleLength) => set({ cycleStartDate, cycleLength }),
  setNotifications: (dailyReminder, reminderTime) => set({ dailyReminder, reminderTime }),
}))
