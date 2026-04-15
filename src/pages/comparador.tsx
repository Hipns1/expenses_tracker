import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { BarChart2 } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { BaseLayout } from '@/components/shared/base-layout'
import { fiscalYearsService, type FiscalYear } from '@/services/fiscalYears'
import { recordsService, type CompareResult } from '@/services/records'

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

interface ChartProps {
  title: string
  dataA: number[]
  dataB: number[]
  labelA: string
  labelB: string
}

function CompareLineChart({ title, dataA, dataB, labelA, labelB }: ChartProps) {
  const data = MONTHS.map((month, i) => ({
    month,
    [labelA]: dataA[i] ?? 0,
    [labelB]: dataB[i] ?? 0,
  }))

  return (
    <div className="bg-card-light dark:bg-card-dark rounded-2xl p-5 border border-secondary-100 dark:border-secondary-dark shadow-sm">
      <h3 className="text-sm font-semibold text-text-main dark:text-white mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
          <Tooltip formatter={(value) => formatCurrency(Number(value))} />
          <Legend />
          <Line type="monotone" dataKey={labelA} stroke="#6366f1" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
          <Line type="monotone" dataKey={labelB} stroke="#f59e0b" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default function Comparador() {
  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>([])
  const [yearAId, setYearAId] = useState<number | null>(null)
  const [yearBId, setYearBId] = useState<number | null>(null)
  const [result, setResult] = useState<CompareResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fiscalYearsService.getAll().then((years) => {
      setFiscalYears(years)
      if (years.length >= 2) {
        setYearAId(years[0].id)
        setYearBId(years[1].id)
      } else if (years.length === 1) {
        setYearAId(years[0].id)
      }
    })
  }, [])

  useEffect(() => {
    if (!yearAId || !yearBId || yearAId === yearBId) {
      setResult(null)
      return
    }
    setLoading(true)
    setError(null)
    recordsService.compare(yearAId, yearBId)
      .then(setResult)
      .catch(() => setError('No se pudo cargar la comparación.'))
      .finally(() => setLoading(false))
  }, [yearAId, yearBId])

  const labelA = useMemo(() => {
    const y = fiscalYears.find(f => f.id === yearAId)
    return y ? `${y.year}` : 'Año A'
  }, [fiscalYears, yearAId])

  const labelB = useMemo(() => {
    const y = fiscalYears.find(f => f.id === yearBId)
    return y ? `${y.year}` : 'Año B'
  }, [fiscalYears, yearBId])

  const sameYear = yearAId !== null && yearBId !== null && yearAId === yearBId

  return (
    <BaseLayout titleHeader="Comparador">
      <div className="flex flex-col gap-6">

        {/* Year selectors */}
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-text-muted">Año A:</span>
            <select
              value={yearAId ?? ''}
              onChange={(e) => setYearAId(Number(e.target.value))}
              className="text-sm border border-secondary-200 dark:border-secondary-dark rounded-lg px-3 py-1.5 bg-card-light dark:bg-card-dark text-text-main dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              {fiscalYears.length === 0 && <option value="">Sin años</option>}
              {fiscalYears.map((y) => (
                <option key={y.id} value={y.id}>{y.year}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-text-muted">Año B:</span>
            <select
              value={yearBId ?? ''}
              onChange={(e) => setYearBId(Number(e.target.value))}
              className="text-sm border border-secondary-200 dark:border-secondary-dark rounded-lg px-3 py-1.5 bg-card-light dark:bg-card-dark text-text-main dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              {fiscalYears.length === 0 && <option value="">Sin años</option>}
              {fiscalYears.map((y) => (
                <option key={y.id} value={y.id}>{y.year}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Validation messages */}
        {fiscalYears.length < 2 && (
          <div className="bg-card-light dark:bg-card-dark rounded-2xl p-8 border border-secondary-100 dark:border-secondary-dark flex flex-col items-center gap-3 text-text-muted">
            <BarChart2 size={40} className="opacity-30" />
            <p className="text-sm text-center">Necesitas al menos dos años fiscales para comparar.<br />Créalos en <span className="text-primary font-medium">Configuración</span>.</p>
          </div>
        )}

        {sameYear && (
          <p className="text-sm text-warning font-medium">Selecciona dos años diferentes para comparar.</p>
        )}

        {error && (
          <p className="text-sm text-danger">{error}</p>
        )}

        {/* Charts */}
        {loading && (
          <div className="text-sm text-text-muted">Cargando comparación...</div>
        )}

        {result && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col gap-4"
          >
            <CompareLineChart
              title="Ingresos normales comparados"
              dataA={result.yearA.incomeNormal}
              dataB={result.yearB.incomeNormal}
              labelA={labelA}
              labelB={labelB}
            />
            <CompareLineChart
              title="Ingresos de bono comparados"
              dataA={result.yearA.incomeBonus}
              dataB={result.yearB.incomeBonus}
              labelA={labelA}
              labelB={labelB}
            />
            <CompareLineChart
              title="Gastos totales comparados"
              dataA={result.yearA.expense}
              dataB={result.yearB.expense}
              labelA={labelA}
              labelB={labelB}
            />
          </motion.div>
        )}

      </div>
    </BaseLayout>
  )
}
