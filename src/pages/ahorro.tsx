import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { PiggyBank, TrendingUp, TrendingDown } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts'
import { BaseLayout } from '@/components/shared/base-layout'
import { recordsService, type SavingsResult } from '@/services/records'

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

const today = new Date()
const todayLabel = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`

export default function Ahorro() {
  const [data, setData] = useState<SavingsResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    recordsService.savings()
      .then(setData)
      .catch(() => setError('No se pudo cargar el ahorro.'))
      .finally(() => setLoading(false))
  }, [])

  const chartData = data?.byYear.map(b => ({ año: String(b.year), Ahorro: b.savings })) ?? []

  return (
    <BaseLayout titleHeader="Ahorro">
      <div className="flex flex-col gap-6">

        {/* Subtitle */}
        <p className="text-sm text-text-muted">
          Ahorro acumulado por años y total, excluyendo el mes actual. Hoy: <span className="font-medium text-text-main dark:text-white">{todayLabel}</span>
        </p>

        {loading && (
          <div className="text-sm text-text-muted">Cargando ahorro...</div>
        )}

        {error && (
          <p className="text-sm text-danger">{error}</p>
        )}

        {!loading && data && (
          <>
            {/* Total savings card */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card-light dark:bg-card-dark rounded-2xl p-6 border border-secondary-100 dark:border-secondary-dark shadow-sm flex items-center gap-5"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${data.total >= 0 ? 'bg-success/10' : 'bg-danger/10'}`}>
                {data.total >= 0
                  ? <TrendingUp size={22} className="text-success" />
                  : <TrendingDown size={22} className="text-danger" />
                }
              </div>
              <div>
                <p className="text-sm font-medium text-text-muted">Total ahorro</p>
                <p className={`text-3xl font-bold ${data.total >= 0 ? 'text-success' : 'text-danger'}`}>
                  {formatCurrency(data.total)}
                </p>
              </div>
            </motion.div>

            {/* Bar chart - savings per year */}
            {chartData.length > 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="bg-card-light dark:bg-card-dark rounded-2xl p-5 border border-secondary-100 dark:border-secondary-dark shadow-sm"
              >
                <h3 className="text-sm font-semibold text-text-main dark:text-white mb-4">Ahorro por año</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="año" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend />
                    <Bar dataKey="Ahorro" radius={[6, 6, 0, 0]}>
                      {chartData.map((entry, i) => (
                        <Cell key={i} fill={entry.Ahorro >= 0 ? '#22c55e' : '#ef4444'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>
            ) : null}

            {/* Detail table */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card-light dark:bg-card-dark rounded-2xl border border-secondary-100 dark:border-secondary-dark shadow-sm overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-secondary-100 dark:border-secondary-dark">
                <h3 className="text-sm font-semibold text-text-main dark:text-white">Detalle por año</h3>
              </div>

              {data.byYear.length === 0 ? (
                <div className="p-10 flex flex-col items-center gap-3 text-text-muted">
                  <PiggyBank size={36} className="opacity-30" />
                  <p className="text-sm">Sin datos de ahorro aún. Agrega registros en la sección Registros.</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs font-semibold uppercase tracking-wide text-text-muted border-b border-secondary-100 dark:border-secondary-dark">
                      <th className="px-5 py-3">Año</th>
                      <th className="px-5 py-3 text-right">Ahorro</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.byYear.map((row) => (
                      <tr
                        key={row.year}
                        className="border-b border-secondary-100 dark:border-secondary-dark last:border-0 hover:bg-bg-light dark:hover:bg-bg-dark/40 transition-colors"
                      >
                        <td className="px-5 py-3 font-medium text-text-main dark:text-white">{row.year}</td>
                        <td className={`px-5 py-3 text-right font-semibold ${row.savings >= 0 ? 'text-success' : 'text-danger'}`}>
                          {formatCurrency(row.savings)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </motion.div>
          </>
        )}

      </div>
    </BaseLayout>
  )
}
