// Type definitions for the Gym PWA

export interface User {
    id: string
    name: string
    email: string
    membershipType: 'basic' | 'premium' | 'vip'
    joinDate: string
    avatar?: string
}

export interface Class {
    id: string
    name: string
    instructor: string
    duration: number // in minutes
    capacity: number
    enrolled: number
    schedule: string
    description: string
    difficulty: 'beginner' | 'intermediate' | 'advanced'
    image?: string
}

export interface Membership {
    id: string
    type: 'basic' | 'premium' | 'vip'
    name: string
    price: number
    features: string[]
    duration: number // in months
}

export interface Workout {
    id: string
    name: string
    exercises: Exercise[]
    duration: number
    difficulty: 'beginner' | 'intermediate' | 'advanced'
    category: string
}

export interface Exercise {
    id: string
    name: string
    sets: number
    reps: number
    rest: number // in seconds
    description: string
    muscleGroup: string
}

export interface Attendance {
    id: string
    userId: string
    date: string
    checkIn: string
    checkOut?: string
}
