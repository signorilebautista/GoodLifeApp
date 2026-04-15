import React, { useState } from 'react';
import { Users, Calendar, FileText, BarChart3, Settings, LogOut, Plus } from 'lucide-react';
import logo from '../assets/logo.png';

interface PlanesProps {
    onLogout: () => void;
    onNavigate: (path: string) => void;
}

interface Plan {
    id: number;
    name: string;
    subtitle: string;
}

interface Exercise {
    id: number;
    name: string;
}

interface Block {
    id: number;
    name: string;
    exercises: Exercise[];
}

const Planes: React.FC<PlanesProps> = ({ onLogout, onNavigate }) => {
    const [selectedPlan] = useState(1);
    const [selectedDay, setSelectedDay] = useState(1);

    // New exercise modal state
    const [showNewExerciseModal, setShowNewExerciseModal] = useState(false);
    const [newExerciseBlock, setNewExerciseBlock] = useState('1');
    const [newExerciseName, setNewExerciseName] = useState('');
    const [newExerciseReps, setNewExerciseReps] = useState('12');
    const [newExerciseSeries, setNewExerciseSeries] = useState('4');
    const [newExerciseVideo, setNewExerciseVideo] = useState('');
    const [newExerciseObservations, setNewExerciseObservations] = useState('');

    const menuItems = [
        { icon: Users, label: 'Socios', active: false },
        { icon: Calendar, label: 'Turnero', active: false },
        { icon: FileText, label: 'Planes', active: true },
        { icon: BarChart3, label: 'Estadísticas', active: false },
        { icon: Settings, label: 'Configuraciones', active: false },
    ];

    const plans: Plan[] = [
        { id: 1, name: 'Signorile Bautista', subtitle: 'Personalizado con lucas' },
        { id: 2, name: 'Signorile Bautista', subtitle: 'Personalizado Juan Ignacio' },
        { id: 3, name: 'Signorile Bautista', subtitle: 'Personalizado Juan Ignacio' },
        { id: 4, name: 'Signorile Bautista', subtitle: 'Personalizado Juan Ignacio' },
    ];

    const blocks: Block[] = [
        {
            id: 1,
            name: 'Bloque 1',
            exercises: [
                { id: 1, name: 'Estiramiento muscular' },
                { id: 2, name: 'Entrada en calor' },
                { id: 3, name: 'Cardio' },
            ]
        },
        {
            id: 2,
            name: 'Bloque 2',
            exercises: [
                { id: 1, name: 'Estiramiento muscular' },
                { id: 2, name: 'Entrada en calor' },
                { id: 3, name: 'Cardio' },
            ]
        },
        {
            id: 3,
            name: 'Bloque 3',
            exercises: []
        },
    ];

    const days = [1, 2, 3, 4, 5];

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <header style={{
                backgroundColor: '#1976D2',
                height: '80px',
                display: 'flex',
                alignItems: 'center',
                padding: '0 24px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img src={logo} alt="Good Life Center" style={{ height: '48px', width: '48px' }} />
                    <h1 style={{
                        color: 'white',
                        fontSize: '24px',
                        fontWeight: 'bold',
                        letterSpacing: '0.05em',
                        margin: 0
                    }}>
                        GOOD LIFE CENTER
                    </h1>
                </div>
            </header>

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {/* Sidebar */}
                <aside style={{
                    width: '330px',
                    backgroundColor: 'white',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRight: '1px solid #D1D5DB'
                }}>
                    {/* Menu Title */}
                    <div style={{
                        padding: '16px 20px',
                        borderBottom: '1px solid #D1D5DB'
                    }}>
                        <button
                            onClick={() => onNavigate('/menu-principal')}
                            style={{
                                fontSize: '15px',
                                fontWeight: '600',
                                color: '#374151',
                                margin: 0,
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: 0
                            }}
                        >
                            Menú
                        </button>
                    </div>

                    <nav style={{ flex: 1, padding: '8px 0' }}>
                        {menuItems.map((item, index) => (
                            <button
                                key={index}
                                onClick={() => {
                                    if (item.label === 'Planes') return;
                                    if (item.label === 'Socios') {
                                        onNavigate('/socios');
                                    } else if (item.label === 'Turnero') {
                                        onNavigate('/turnero');
                                    } else {
                                        onNavigate('/menu-principal');
                                    }
                                }}
                                style={{
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '12px 20px',
                                    color: '#374151',
                                    backgroundColor: item.active ? '#F3F4F6' : 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '16px',
                                    textAlign: 'left'
                                }}
                                onMouseEnter={(e) => !item.active && (e.currentTarget.style.backgroundColor = '#F3F4F6')}
                                onMouseLeave={(e) => !item.active && (e.currentTarget.style.backgroundColor = 'transparent')}
                            >
                                <item.icon size={20} />
                                <span>{item.label}</span>
                            </button>
                        ))}
                    </nav>

                    {/* Logout Button at Bottom */}
                    <div style={{ borderTop: '1px solid #D1D5DB' }}>
                        <button
                            onClick={onLogout}
                            style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '14px 20px',
                                color: '#374151',
                                backgroundColor: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '16px',
                                textAlign: 'left'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F3F4F6'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            <LogOut size={20} />
                            <span>Cerrar Sesión</span>
                        </button>
                    </div>
                </aside>

                {/* Main Content */}
                <main style={{
                    flex: 1,
                    backgroundColor: '#E5E7EB',
                    padding: '24px',
                    overflowY: 'auto',
                    display: 'flex',
                    gap: '24px'
                }}>
                    {/* Plans List */}
                    <div style={{
                        width: '320px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                    }}>
                        {plans.map((plan) => (
                            <div
                                key={plan.id}
                                style={{
                                    backgroundColor: 'white',
                                    borderRadius: '8px',
                                    padding: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    cursor: 'pointer',
                                    border: selectedPlan === plan.id ? '2px solid #1976D2' : '2px solid transparent'
                                }}
                            >
                                <div style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #4ADE80, #3B82F6)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    fontSize: '20px',
                                    flexShrink: 0
                                }}>
                                    👤
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        color: '#111827',
                                        margin: 0,
                                        marginBottom: '4px'
                                    }}>
                                        {plan.name}
                                    </p>
                                    <p style={{
                                        fontSize: '12px',
                                        color: '#6B7280',
                                        margin: 0
                                    }}>
                                        {plan.subtitle}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Training Content */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {/* Header with Title and Add Button */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div style={{
                                backgroundColor: '#1976D2',
                                color: 'white',
                                padding: '12px 24px',
                                borderRadius: '8px',
                                fontSize: '18px',
                                fontWeight: 'bold'
                            }}>
                                ENTRAMIENTO
                            </div>
                            <button
                                onClick={() => setShowNewExerciseModal(true)}
                                style={{
                                    backgroundColor: '#111827',
                                    color: 'white',
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    border: 'none',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <Plus size={24} />
                            </button>
                        </div>

                        <div style={{ display: 'flex', gap: '20px', flex: 1 }}>
                            {/* Days Selector */}
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px'
                            }}>
                                {days.map((day) => (
                                    <button
                                        key={day}
                                        onClick={() => setSelectedDay(day)}
                                        style={{
                                            backgroundColor: selectedDay === day ? '#424242' : '#9CA3AF',
                                            color: 'white',
                                            padding: '12px 24px',
                                            borderRadius: '6px',
                                            border: 'none',
                                            cursor: 'pointer',
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            minWidth: '100px'
                                        }}
                                    >
                                        Día {day}
                                    </button>
                                ))}
                            </div>

                            {/* Exercise Blocks */}
                            <div style={{
                                flex: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '20px',
                                overflowY: 'auto'
                            }}>
                                {blocks.map((block) => (
                                    <div key={block.id}>
                                        <h3 style={{
                                            fontSize: '18px',
                                            fontWeight: 'bold',
                                            color: '#111827',
                                            marginBottom: '12px',
                                            marginTop: 0
                                        }}>
                                            {block.name}
                                        </h3>
                                        <div style={{
                                            backgroundColor: '#D1D5DB',
                                            borderRadius: '8px',
                                            padding: '16px'
                                        }}>
                                            {block.exercises.length > 0 ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                    {block.exercises.map((exercise) => (
                                                        <div
                                                            key={exercise.id}
                                                            style={{
                                                                backgroundColor: '#9CA3AF',
                                                                color: 'white',
                                                                padding: '12px 16px',
                                                                borderRadius: '6px',
                                                                display: 'flex',
                                                                justifyContent: 'space-between',
                                                                alignItems: 'center'
                                                            }}
                                                        >
                                                            <span style={{ fontSize: '14px' }}>
                                                                Ej. {exercise.id}
                                                            </span>
                                                            <span style={{ fontSize: '14px', flex: 1, marginLeft: '16px' }}>
                                                                {exercise.name}
                                                            </span>
                                                            <button style={{
                                                                background: 'none',
                                                                border: 'none',
                                                                color: 'white',
                                                                cursor: 'pointer',
                                                                fontSize: '18px',
                                                                padding: '0 8px'
                                                            }}>
                                                                ☰
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p style={{
                                                    color: '#6B7280',
                                                    fontSize: '14px',
                                                    margin: 0,
                                                    textAlign: 'center'
                                                }}>
                                                    Sin ejercicios
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            {/* New Exercise Modal */}
            {showNewExerciseModal && (
                <div
                    onClick={() => setShowNewExerciseModal(false)}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            backgroundColor: '#D1D5DB',
                            borderRadius: '12px',
                            padding: '32px',
                            maxWidth: '600px',
                            width: '90%',
                            position: 'relative'
                        }}
                    >
                        {/* Form Fields */}
                        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                            {/* Bloque N° */}
                            <div style={{ flex: 1 }}>
                                <label style={{
                                    display: 'block',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    color: '#111827',
                                    marginBottom: '8px'
                                }}>
                                    Bloque N°
                                </label>
                                <select
                                    value={newExerciseBlock}
                                    onChange={(e) => setNewExerciseBlock(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        border: '1px solid #9CA3AF',
                                        borderRadius: '6px',
                                        fontSize: '14px',
                                        backgroundColor: 'white',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <option value="1">1</option>
                                    <option value="2">2</option>
                                    <option value="3">3</option>
                                </select>
                            </div>

                            {/* Nombre Ej. */}
                            <div style={{ flex: 2 }}>
                                <label style={{
                                    display: 'block',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    color: '#111827',
                                    marginBottom: '8px'
                                }}>
                                    Nombre Ej.
                                </label>
                                <select
                                    value={newExerciseName}
                                    onChange={(e) => setNewExerciseName(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        border: '1px solid #9CA3AF',
                                        borderRadius: '6px',
                                        fontSize: '14px',
                                        backgroundColor: 'white',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <option value="">Seleccionar...</option>
                                    <option value="Sentadillas">Sentadillas</option>
                                    <option value="Press de banca">Press de banca</option>
                                    <option value="Peso muerto">Peso muerto</option>
                                    <option value="Dominadas">Dominadas</option>
                                    <option value="Cardio">Cardio</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                            {/* Repeticiones */}
                            <div style={{ flex: 1 }}>
                                <label style={{
                                    display: 'block',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    color: '#111827',
                                    marginBottom: '8px'
                                }}>
                                    Repeticiones
                                </label>
                                <input
                                    type="number"
                                    value={newExerciseReps}
                                    onChange={(e) => setNewExerciseReps(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        border: '1px solid #9CA3AF',
                                        borderRadius: '6px',
                                        fontSize: '14px',
                                        backgroundColor: 'white'
                                    }}
                                />
                            </div>

                            {/* Series */}
                            <div style={{ flex: 1 }}>
                                <label style={{
                                    display: 'block',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    color: '#111827',
                                    marginBottom: '8px'
                                }}>
                                    Series
                                </label>
                                <input
                                    type="number"
                                    value={newExerciseSeries}
                                    onChange={(e) => setNewExerciseSeries(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        border: '1px solid #9CA3AF',
                                        borderRadius: '6px',
                                        fontSize: '14px',
                                        backgroundColor: 'white'
                                    }}
                                />
                            </div>

                            {/* Video */}
                            <div style={{ flex: 2 }}>
                                <label style={{
                                    display: 'block',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    color: '#111827',
                                    marginBottom: '8px'
                                }}>
                                    Video
                                </label>
                                <select
                                    value={newExerciseVideo}
                                    onChange={(e) => setNewExerciseVideo(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        border: '1px solid #9CA3AF',
                                        borderRadius: '6px',
                                        fontSize: '14px',
                                        backgroundColor: 'white',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <option value="">Seleccionar...</option>
                                    <option value="Sentadilla.mp4">Sentadilla.mp4</option>
                                    <option value="Press.mp4">Press.mp4</option>
                                    <option value="Peso_muerto.mp4">Peso_muerto.mp4</option>
                                </select>
                            </div>
                        </div>

                        {/* Observaciones */}
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{
                                display: 'block',
                                fontSize: '14px',
                                fontWeight: '600',
                                color: '#111827',
                                marginBottom: '8px'
                            }}>
                                Observaciones
                            </label>
                            <textarea
                                value={newExerciseObservations}
                                onChange={(e) => setNewExerciseObservations(e.target.value)}
                                placeholder="Espalda siempre recta"
                                rows={4}
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    border: '1px solid #9CA3AF',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                    backgroundColor: 'white',
                                    resize: 'vertical',
                                    fontFamily: 'inherit'
                                }}
                            />
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button
                                onClick={() => setShowNewExerciseModal(false)}
                                style={{
                                    backgroundColor: 'white',
                                    color: '#111827',
                                    padding: '10px 24px',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                    border: '1px solid #9CA3AF',
                                    cursor: 'pointer',
                                    fontWeight: '500'
                                }}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => {
                                    // Handle save logic here
                                    setShowNewExerciseModal(false);
                                }}
                                style={{
                                    backgroundColor: '#111827',
                                    color: 'white',
                                    padding: '10px 24px',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontWeight: '500'
                                }}
                            >
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Planes;
