import { Service, Member, Schedule, TrainingBlock } from '../types/types';

export const mockServices: Service[] = [
    { id: '1', name: 'Rutina Deportiva', price: 25000, type: 'deportiva' },
    { id: '2', name: 'Rutina Funcional', price: 25000, type: 'funcional' },
    { id: '3', name: 'Entrenamiento', price: 25000, type: 'entrenamiento' },
    { id: '4', name: 'Socio Particular', price: 25000, type: 'particular' },
    { id: '5', name: 'Socio Funcional', price: 25000, type: 'funcional' },
    { id: '6', name: 'Clase Particular', price: 25000, type: 'particular' },
    { id: '7', name: 'Clase Funcional', price: 25000, type: 'funcional' },
    { id: '8', name: 'Bono Entrenamiento', price: 25000, type: 'bono' },
    { id: '9', name: 'Bono Deportivo', price: 25000, type: 'bono' },
    { id: '10', name: 'Bono Funcional', price: 25000, type: 'bono' },
];

export const mockMembers: Member[] = [
    {
        id: '1',
        name: 'Bautista Signorile',
        deuda: -13000,
        plan: 'Premium',
        diasRestantes: 5,
        ultimoDiaAsistido: '26/09/2025',
        status: 'active',
    },
    {
        id: '2',
        name: 'Juan Pérez',
        deuda: 0,
        plan: 'Básico',
        diasRestantes: 12,
        ultimoDiaAsistido: '20/12/2025',
        status: 'active',
    },
    {
        id: '3',
        name: 'María González',
        deuda: 5000,
        plan: 'Premium',
        diasRestantes: 3,
        ultimoDiaAsistido: '19/12/2025',
        status: 'pending',
    },
];

export const mockSchedules: Schedule[] = [
    {
        id: '1',
        date: '2025-08-21',
        time: '09:00',
        professor: 'Bautista Signorile',
        classType: 'Profe',
        sede: 'Nva. Cba',
    },
    {
        id: '2',
        date: '2025-08-21',
        time: '11:00',
        professor: 'Bautista Signorile',
        classType: 'Profe',
        sede: 'Nva. Cba',
    },
    {
        id: '3',
        date: '2025-08-21',
        time: '14:00',
        professor: 'Bautista Signorile',
        classType: 'Profe',
        sede: 'Nva. Cba',
    },
    {
        id: '4',
        date: '2025-08-22',
        time: '09:00',
        professor: 'Bautista Signorile',
        classType: 'Profe',
        sede: 'Sante. Nva. Cba',
    },
    {
        id: '5',
        date: '2025-08-22',
        time: '11:00',
        professor: 'Bautista Signorile',
        classType: 'Profe',
        sede: 'Sante. Nva. Cba',
    },
];

export const mockTrainingBlocks: TrainingBlock[] = [
    {
        id: '1',
        name: 'Bloque 1',
        exercises: [
            { id: '1', name: 'Press de banca', sets: 3, reps: 12, weight: 60 },
            { id: '2', name: 'Sentadillas', sets: 4, reps: 10, weight: 80 },
            { id: '3', name: 'Peso muerto', sets: 3, reps: 8, weight: 100 },
        ],
    },
    {
        id: '2',
        name: 'Bloque 2',
        exercises: [
            { id: '4', name: 'Dominadas', sets: 3, reps: 10 },
            { id: '5', name: 'Remo con barra', sets: 3, reps: 12, weight: 50 },
            { id: '6', name: 'Curl de bíceps', sets: 3, reps: 15, weight: 15 },
        ],
    },
    {
        id: '3',
        name: 'Bloque 3',
        exercises: [
            { id: '7', name: 'Plancha', sets: 3, reps: 60, details: 'segundos' },
            { id: '8', name: 'Burpees', sets: 3, reps: 15 },
            { id: '9', name: 'Mountain climbers', sets: 3, reps: 20 },
        ],
    },
];
