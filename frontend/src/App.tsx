import { Route, Routes } from 'react-router-dom'
import { MapPage } from './routes/MapPage'
import { ImprintPage } from './routes/ImprintPage'

export default function App(): React.JSX.Element {
  return (
    <Routes>
      <Route path="/" element={<MapPage />} />
      <Route path="/imprint" element={<ImprintPage />} />
    </Routes>
  )
}
