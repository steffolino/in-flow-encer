import { Route, Routes } from 'react-router-dom'
import { MapPage } from './routes/MapPage'
import { AboutPage } from './routes/AboutPage'

export default function App(): React.JSX.Element {
  return (
    <Routes>
      <Route path="/" element={<MapPage />} />
      <Route path="/about" element={<AboutPage />} />
    </Routes>
  )
}
