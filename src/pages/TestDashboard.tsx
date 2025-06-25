import React from 'react'

export function TestDashboard() {
  console.log('TestDashboard rendering')
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Test Dashboard</h1>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <p>Si puedes ver esto, el componente está funcionando correctamente.</p>
      </div>
    </div>
  )
}
