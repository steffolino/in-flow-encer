import { Route, Routes } from 'react-router-dom'
import { MapPage } from './routes/MapPage'

export default function App(): React.JSX.Element {
  return (
    <Routes>
      <Route path="/" element={<MapPage />} />
    </Routes>
  )
}
