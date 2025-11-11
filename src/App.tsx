import { useRoutes } from 'react-router-dom'
import { routes, toReactRoutes } from './router/routes'

function App() {
  const routeElement = useRoutes(toReactRoutes(routes))
  return routeElement
}

export default App
