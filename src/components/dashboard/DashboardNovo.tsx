export default function DashboardNovo() {
  return (
    <div className="p-6 bg-gray-900 min-h-screen text-white">

      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

        <div className="bg-purple-600 p-5 rounded-2xl">Clientes</div>
        <div className="bg-green-600 p-5 rounded-2xl">Caixa</div>
        <div className="bg-yellow-500 p-5 rounded-2xl">A receber</div>
        <div className="bg-red-500 p-5 rounded-2xl">Reparos</div>

      </div>

    </div>
  )
}
