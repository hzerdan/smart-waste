import { BrowserRouter } from 'react-router-dom'
import AppRouter from './router'
import { ToastProvider } from './context/ToastContext'

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AppRouter />
      </ToastProvider>
    </BrowserRouter>
  )
}

export default App
