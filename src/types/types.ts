export interface User {
    id: string;
    username: string;
    password: string;
    role: 'admin' | 'member';
}

export interface Service {
    id: string;
    name: string;
    price: number;
    type: 'deportiva' | 'funcional' | 'entrenamiento' | 'particular' | 'bono';
}

export interface Member {
    id: string;
    name: string;
    avatar?: string;
    deuda: number;
    plan: string;
    diasRestantes: number;
    ultimoDiaAsistido: string;
    status: 'active' | 'inactive' | 'pending';
}

export interface Schedule {
    id: string;
    date: string;
    time: string;
    professor: string;
    classType: string;
    sede: string;
}

export interface Exercise {
    id: string;
    name: string;
    sets?: number;
    reps?: number;
    weight?: number;
    details?: string;
}

export interface TrainingBlock {
    id: string;
    name: string;
    exercises: Exercise[];
}

export interface TrainingSession {
    id: string;
    memberId: string;
    date: string;
    blocks: TrainingBlock[];
}
