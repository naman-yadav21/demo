import { AppRoutes } from './routes/AppRoutes.jsx'
import { ToastProvider } from './context/ToastContext.jsx'
import { DemoAuthProvider } from './context/DemoAuthContext.jsx'

export default function App() {
  return (
    <DemoAuthProvider>
      <ToastProvider>
        <AppRoutes />
      </ToastProvider>
    </DemoAuthProvider>
  )
}
