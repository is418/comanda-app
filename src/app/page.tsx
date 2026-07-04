import { Dashboard } from "@/components/Dashboard";

// El middleware ya protege esta ruta: si no hay sesión, redirige a /login
// antes de que este componente se renderice.
export default function Home() {
  return <Dashboard />;
}
