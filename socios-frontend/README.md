# 🏋️ Gym PWA - Progressive Web App para Gimnasio

Una aplicación web progresiva moderna para la gestión de gimnasios, construida con las últimas tecnologías web.

## 🚀 Tecnologías Utilizadas

- **React 19** - Biblioteca de UI con las últimas características
- **TypeScript** - Tipado estático para mayor seguridad
- **Tailwind CSS** - Framework de CSS utility-first
- **React Router DOM** - Enrutamiento del lado del cliente
- **Vite** - Build tool ultrarrápido
- **PWA (Progressive Web App)** - Funcionalidad offline y instalable
- **CSS3 Animations** - Animaciones fluidas y modernas

## 📦 Instalación

Las dependencias ya están instaladas. Si necesitas reinstalarlas:

```bash
npm install
```

## 🛠️ Comandos Disponibles

### Desarrollo
```bash
npm run dev
```
Inicia el servidor de desarrollo en `http://localhost:5173`

### Build
```bash
npm run build
```
Genera la versión de producción optimizada

### Preview
```bash
npm run preview
```
Previsualiza la build de producción localmente

### Lint
```bash
npm run lint
```
Ejecuta el linter para verificar el código

## 📁 Estructura del Proyecto

```
gym-pwa/
├── public/              # Archivos estáticos
├── src/
│   ├── assets/         # Imágenes, iconos, etc.
│   ├── components/     # Componentes reutilizables
│   ├── pages/          # Páginas de la aplicación
│   ├── hooks/          # Custom React hooks
│   ├── types/          # Definiciones de TypeScript
│   ├── utils/          # Funciones auxiliares
│   ├── App.tsx         # Componente principal
│   ├── main.tsx        # Punto de entrada
│   └── index.css       # Estilos globales
├── tailwind.config.js  # Configuración de Tailwind
├── vite.config.ts      # Configuración de Vite + PWA
└── tsconfig.json       # Configuración de TypeScript
```

## 🎨 Características Configuradas

### Tailwind CSS
- ✅ Colores personalizados (primary, accent)
- ✅ Fuente Inter de Google Fonts
- ✅ Animaciones predefinidas (fade-in, slide-up, slide-down, scale-in)
- ✅ Componentes reutilizables (.btn-primary, .card, .input-field)
- ✅ Utilidades personalizadas (.text-gradient, .glass-effect)

### PWA
- ✅ Service Worker configurado
- ✅ Manifest.json para instalación
- ✅ Caché de assets estáticos
- ✅ Funcionamiento offline
- ✅ Actualización automática

### TypeScript
- ✅ Tipos definidos para entidades principales
- ✅ Interfaces para User, Class, Membership, Workout, Exercise

### Custom Hooks
- ✅ `useLocalStorage` - Persistencia de datos
- ✅ `useIsMobile` - Detección de dispositivos móviles
- ✅ `useOnlineStatus` - Estado de conexión

## 🎯 Próximos Pasos

1. **Proporcionar las imágenes de diseño** - Para implementar la interfaz según los mockups
2. **Definir las páginas principales** - Home, Clases, Membresías, Perfil, etc.
3. **Implementar componentes** - Navbar, Cards, Forms, etc.
4. **Configurar rutas** - Definir la navegación de la aplicación

## 📱 PWA - Instalación

Una vez desplegada, la aplicación puede ser instalada en dispositivos móviles y desktop como una app nativa.

## 🎨 Paleta de Colores

- **Primary**: Azul (#0ea5e9) - Para acciones principales
- **Accent**: Rojo (#ef4444) - Para destacados y alertas
- **Grises**: Escala completa para textos y fondos

## 📝 Notas

- El proyecto está configurado para usar React 19 con `--legacy-peer-deps`
- Las animaciones CSS3 están preconfiguradas en Tailwind
- El PWA está listo para funcionar offline una vez desplegado

## 🤝 Desarrollo

Para comenzar el desarrollo, ejecuta:

```bash
npm run dev
```

Y abre tu navegador en `http://localhost:5173`

---

**Estado**: ✅ Proyecto configurado y listo para desarrollo
