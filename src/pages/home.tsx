import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight, BookOpen, PiggyBank, BarChart2 } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { BaseLayout } from '@/components/shared/base-layout'
import { fiscalYearsService, type FiscalYear } from '@/services/fiscalYears'
import { recordsService, type Record as FinanceRecord } from '@/services/records'

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

export default function Home() {
  const navigate = useNavigate()
  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>([])
  const [selectedYearId, setSelectedYearId] = useState<number | null>(null)
  const [records, setRecords] = useState<FinanceRecord[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fiscalYearsService.getAll().then((years) => {
      setFiscalYears(years)
      if (years.length > 0) {
        const latest = years.reduce((a, b) => (a.year > b.year ? a : b))
        setSelectedYearId(latest.id)
      }
    })
  }, [])

  useEffect(() => {
    if (!selectedYearId) return
    setLoading(true)
    recordsService.getByYear(selectedYearId).then((data) => {
      setRecords(data)
    }).finally(() => setLoading(false))
  }, [selectedYearId])

  const { totalIncome, totalExpenses, balance } = useMemo(() => {
    const totalIncome = records
      .filter(r => r.type === 'IncomeNormal' || r.type === 'IncomeBonus')
      .reduce((s, r) => s + r.amount, 0)
    const totalExpenses = records
      .filter(r => r.type === 'Expense')
      .reduce((s, r) => s + r.amount, 0)
    return { totalIncome, totalExpenses, balance: totalIncome - totalExpenses }
  }, [records])

  // Monthly data for chart (IncomeNormal only, no bonuses)
  const chartData = useMemo(() =>
    MONTHS.map((month, i) => {
      const monthNum = i + 1
      const ingresos = records
        .filter(r => r.month === monthNum && r.type === 'IncomeNormal')
        .reduce((s, r) => s + r.amount, 0)
      const gastos = records
        .filter(r => r.month === monthNum && r.type === 'Expense')
        .reduce((s, r) => s + r.amount, 0)
      return { month, Ingresos: ingresos, Gastos: gastos }
    })
  , [records])

  return (
    <BaseLayout titleHeader="Dashboard">
      <div className="flex flex-col gap-6">

        {/* Fiscal year selector */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-text-muted font-medium">Año fiscal:</span>
          <select
            value={selectedYearId ?? ''}
            onChange={(e) => setSelectedYearId(Number(e.target.value))}
            className="text-sm border border-secondary-200 dark:border-secondary-dark rounded-lg px-3 py-1.5 bg-card-light dark:bg-card-dark text-text-main dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            {fiscalYears.length === 0 && <option value="">Sin años fiscales</option>}
            {fiscalYears.map((y) => (
              <option key={y.id} value={y.id}>{y.year}</option>
            ))}
          </select>
        </div>

        {/* Summary cards */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card-light dark:bg-card-dark rounded-2xl p-5 border border-secondary-100 dark:border-secondary-dark shadow-sm flex flex-col gap-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-text-muted">Ingresos</span>
              <TrendingUp size={18} className="text-success" />
            </div>
            <p className="text-2xl font-bold text-text-main dark:text-white">{formatCurrency(totalIncome)}</p>
            <p className="text-xs text-text-muted">Incluye ingresos normales y bonos</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-card-light dark:bg-card-dark rounded-2xl p-5 border border-secondary-100 dark:border-secondary-dark shadow-sm flex flex-col gap-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-text-muted">Gastos</span>
              <TrendingDown size={18} className="text-danger" />
            </div>
            <p className="text-2xl font-bold text-text-main dark:text-white">{formatCurrency(totalExpenses)}</p>
            <p className="text-xs text-text-muted">Total de egresos registrados</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card-light dark:bg-card-dark rounded-2xl p-5 border border-secondary-100 dark:border-secondary-dark shadow-sm flex flex-col gap-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-text-muted">Balance</span>
              {balance >= 0
                ? <ArrowUpRight size={18} className="text-success" />
                : <ArrowDownRight size={18} className="text-danger" />
              }
            </div>
            <p className={`text-2xl font-bold ${balance >= 0 ? 'text-success' : 'text-danger'}`}>
              {formatCurrency(balance)}
            </p>
            <p className="text-xs text-text-muted">
              {balance >= 0 ? 'Estás ahorrando este año' : 'Gastos mayores a ingresos'}
            </p>
          </motion.div>
        </div>

        {/* Line chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-card-light dark:bg-card-dark rounded-2xl p-5 border border-secondary-100 dark:border-secondary-dark shadow-sm"
        >
          <h3 className="text-sm font-semibold text-text-main dark:text-white mb-1">Evolución mensual</h3>
          <p className="text-xs text-text-muted mb-4">
            Comparación de ingresos y gastos sin incluir bonos — año {fiscalYears.find(y => y.id === selectedYearId)?.year ?? '—'}
          </p>

          {loading ? (
            <div className="h-48 flex items-center justify-center text-text-muted text-sm">Cargando datos...</div>
          ) : records.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center gap-2 text-text-muted">
              <Wallet size={32} className="opacity-30" />
              <p className="text-sm">Sin registros para este año fiscal</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-secondary-100 dark:stroke-secondary-800" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Legend />
                <Line type="monotone" dataKey="Ingresos" stroke="#22c55e" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                <Line type="monotone" dataKey="Gastos" stroke="#ef4444" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Quick action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid gap-3 grid-cols-1 sm:grid-cols-3"
        >
          <button
            onClick={() => navigate('/registros')}
            className="flex items-center gap-3 p-4 rounded-xl border border-secondary-100 dark:border-secondary-dark bg-card-light dark:bg-card-dark hover:border-primary/50 hover:bg-primary/5 transition-all text-left group"
          >
            <BookOpen size={20} className="text-primary flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-text-main dark:text-white group-hover:text-primary transition-colors">Gestionar registros</p>
              <p className="text-xs text-text-muted">Ver y editar ingresos y gastos</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/ahorro')}
            className="flex items-center gap-3 p-4 rounded-xl border border-secondary-100 dark:border-secondary-dark bg-card-light dark:bg-card-dark hover:border-primary/50 hover:bg-primary/5 transition-all text-left group"
          >
            <PiggyBank size={20} className="text-primary flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-text-main dark:text-white group-hover:text-primary transition-colors">Ver ahorro</p>
              <p className="text-xs text-text-muted">Ahorro acumulado por año</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/comparador')}
            className="flex items-center gap-3 p-4 rounded-xl border border-secondary-100 dark:border-secondary-dark bg-card-light dark:bg-card-dark hover:border-primary/50 hover:bg-primary/5 transition-all text-left group"
          >
            <BarChart2 size={20} className="text-primary flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-text-main dark:text-white group-hover:text-primary transition-colors">Ir al comparador</p>
              <p className="text-xs text-text-muted">Compara dos años fiscales</p>
            </div>
          </button>
        </motion.div>

      </div>
    </BaseLayout>
  )
}
