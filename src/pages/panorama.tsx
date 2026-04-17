import React, { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { LayoutGrid, BarChart3, ChevronDown, TrendingUp, TrendingDown, Wallet } from 'lucide-react'
import { BaseLayout } from '@/components/shared/base-layout'
import { fiscalYearsService, type FiscalYear } from '@/services/fiscalYears'
import { categoriesService, type Category } from '@/services/categories'
import { recordsService, type Record as FinanceRecord } from '@/services/records'
import { categoryGroupsService, type CategoryGroup } from '@/services/categoryGroups'
import { toast } from 'react-toastify'

const MS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
const MONTHS_FULL = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

const fmtShort = (n: number): string => {
  const abs = Math.abs(n)
  if (abs === 0) return '—'
  const sign = n < 0 ? '-' : ''
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(0)}k`
  return fmt(n)
}

type MonthlyData = {
  incomeNormal: number
  incomeBonus: number
  expenses: Record<number, number> // -1 = uncategorized
}

/* ── Celda de tabla ── */
function TCell({
  value, highlight, muted, bold, indent, zero = '—',
}: {
  value: number; highlight?: 'green' | 'red'; muted?: boolean; bold?: boolean; indent?: boolean; zero?: string
}) {
  const color = highlight === 'green'
    ? (value > 0 ? 'text-success' : value < 0 ? 'text-danger' : 'text-secondary-300')
    : highlight === 'red'
    ? (value > 0 ? 'text-danger' : 'text-secondary-300')
    : muted ? 'text-text-muted' : 'text-text-main'

  return (
    <td className={`px-2 py-1.5 text-right whitespace-nowrap tabular-nums ${color} ${bold ? 'font-semibold' : ''} ${indent ? 'pl-7' : ''}`}>
      {value === 0 ? zero : fmtShort(value)}
    </td>
  )
}

/* ── Encabezado de sección en tabla ── */
function SectionHeader({ label, color }: { label: string; color: 'green' | 'red' | 'neutral' }) {
  const bg = color === 'green' ? 'bg-success/5 text-success' : color === 'red' ? 'bg-danger/5 text-danger' : 'bg-secondary-50 text-text-muted'
  return (
    <tr>
      <td colSpan={15} className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest ${bg}`}>
        {label}
      </td>
    </tr>
  )
}

/* ── Fila de análisis de categoría/grupo ── */
function AnalysisBar({ name, amount, ideal, income, indent = false }: {
  name: string; amount: number; ideal: number; income: number; indent?: boolean
}) {
  const pct = income > 0 ? Math.min(100, (amount / income) * 100) : 0
  const idealPct = income > 0 && ideal > 0 ? Math.min(100, (ideal / income) * 100) : 0
  const ratio = ideal > 0 ? amount / ideal : null
  const isOver = ratio !== null && ratio > 1
  const isWarn = ratio !== null && ratio >= 0.8 && ratio <= 1
  const barColor = isOver ? 'bg-danger' : isWarn ? 'bg-amber-400' : 'bg-primary'

  return (
    <div className={`${indent ? 'pl-4 border-l-2 border-secondary-100 ml-2' : ''}`}>
      <div className='flex items-start justify-between gap-3 mb-1.5'>
        <span className={`text-sm font-medium ${indent ? 'text-text-muted text-xs' : 'text-text-main'} leading-tight`}>{name}</span>
        <div className='text-right flex-shrink-0'>
          <span className={`font-bold ${indent ? 'text-xs text-text-muted' : 'text-sm text-text-main'}`}>{fmt(amount)}</span>
          {income > 0 && (
            <span className='text-xs text-text-muted ml-1.5'>{pct.toFixed(1)}%</span>
          )}
        </div>
      </div>
      <div className='h-1.5 bg-secondary-100 rounded-full overflow-visible relative'>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={`h-full rounded-full ${barColor}`}
        />
        {idealPct > 0 && (
          <div
            className='absolute top-1/2 -translate-y-1/2 w-px h-3 bg-secondary-400 rounded-full'
            style={{ left: `${idealPct}%` }}
            title={`Ideal: ${fmt(ideal)}`}
          />
        )}
      </div>
      {ideal > 0 && (
        <div className='flex items-center justify-between mt-1'>
          <span className='text-[11px] text-text-muted'>Ideal: {fmt(ideal)}</span>
          <span className={`text-[11px] font-medium ${isOver ? 'text-danger' : isWarn ? 'text-amber-600' : 'text-success'}`}>
            {ratio !== null
              ? isOver
                ? `+${fmt(amount - ideal)} sobre ideal`
                : `${fmt(ideal - amount)} disponible`
              : ''}
          </span>
        </div>
      )}
    </div>
  )
}

/* ── Tarjeta de grupo en análisis ── */
function GroupAnalysisCard({ group, amount, ideal, income, categories, catAnnual, catMonths }: {
  group: CategoryGroup; amount: number; ideal: number; income: number
  categories: Record<number, string>
  catAnnual: Record<number, number>
  catMonths: (cid: number) => number
}) {
  const [expanded, setExpanded] = useState(false)
  const pct = income > 0 ? Math.min(100, (amount / income) * 100) : 0
  const idealPct = income > 0 && ideal > 0 ? Math.min(100, (ideal / income) * 100) : 0
  const ratio = ideal > 0 ? amount / ideal : null
  const isOver = ratio !== null && ratio > 1
  const isWarn = ratio !== null && ratio >= 0.8 && ratio <= 1
  const barColor = isOver ? 'bg-danger' : isWarn ? 'bg-amber-400' : 'bg-primary'

  return (
    <div className='bg-white rounded-2xl border border-secondary-100 overflow-hidden'>
      <div className='p-4'>
        <div className='flex items-start justify-between gap-3 mb-2'>
          <button
            onClick={() => setExpanded((v) => !v)}
            className='flex items-center gap-1.5 text-sm font-bold text-text-main hover:text-primary transition-colors'
          >
            <ChevronDown size={14} className={`transition-transform flex-shrink-0 ${expanded ? 'rotate-180' : ''}`} />
            {group.name}
          </button>
          <div className='text-right flex-shrink-0'>
            <span className='text-sm font-bold text-text-main'>{fmt(amount)}</span>
            {income > 0 && <span className='text-xs text-text-muted ml-1.5'>{pct.toFixed(1)}%</span>}
          </div>
        </div>
        <div className='h-2 bg-secondary-100 rounded-full overflow-visible relative'>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className={`h-full rounded-full ${barColor}`}
          />
          {idealPct > 0 && (
            <div
              className='absolute top-1/2 -translate-y-1/2 w-px h-4 bg-secondary-400 rounded-full'
              style={{ left: `${idealPct}%` }}
            />
          )}
        </div>
        {ideal > 0 && (
          <div className='flex items-center justify-between mt-1.5'>
            <span className='text-xs text-text-muted'>Ideal: {fmt(ideal)}</span>
            <span className={`text-xs font-medium ${isOver ? 'text-danger' : isWarn ? 'text-amber-600' : 'text-success'}`}>
              {ratio !== null
                ? isOver ? `+${fmt(amount - ideal)} sobre ideal` : `${fmt(ideal - amount)} disponible`
                : ''}
            </span>
          </div>
        )}
      </div>
      {expanded && (
        <div className='border-t border-secondary-50 px-4 py-3 space-y-3 bg-secondary-50/40'>
          {Array.isArray(group.categoryIds) && group.categoryIds.map((cid) => {
            const catAmt = catMonths(cid)
            if (catAmt === 0 && !(catAnnual[cid] ?? 0)) return null
            return (
              <AnalysisBar
                key={cid}
                name={categories[cid] ?? `Cat ${cid}`}
                amount={catAmt}
                ideal={0} // No individual ideals anymore
                income={income}
                indent
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ── Página principal ── */
export default function Panorama() {
  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>([])
  const [selectedYearId, setSelectedYearId] = useState<number | null>(null)
  const [records, setRecords] = useState<FinanceRecord[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState<'table' | 'analysis'>('table')
  const [analysisMonth, setAnalysisMonth] = useState<number | null>(null)
  const [groups, setGroups] = useState<CategoryGroup[]>([])

  useEffect(() => {
    Promise.all([
      fiscalYearsService.getAll(),
      categoriesService.getAll(),
      categoryGroupsService.getAll()
    ]).then(([years, cats, grps]) => {
      const sorted = [...years].sort((a, b) => b.year - a.year)
      setFiscalYears(sorted)
      if (sorted.length > 0) setSelectedYearId(sorted[0].id)
      setCategories(Array.isArray(cats) ? cats : [])
      setGroups(Array.isArray(grps) ? grps : [])
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedYearId) return
    setLoading(true)
    recordsService.getByYear(selectedYearId)
      .then(setRecords)
      .catch(() => toast.error('Error al cargar datos'))
      .finally(() => setLoading(false))
  }, [selectedYearId])

  /* ── Agregados mensuales ── */
  const monthlyData = useMemo((): MonthlyData[] => {
    const data: MonthlyData[] = Array.from({ length: 12 }, () => ({
      incomeNormal: 0, incomeBonus: 0, expenses: {},
    }))
    for (const r of records) {
      const idx = r.month - 1
      if (idx < 0 || idx > 11) continue
      if (r.isLoan || r.isDebt) continue
      if (r.type === 'IncomeNormal') data[idx].incomeNormal += r.amount
      else if (r.type === 'IncomeBonus') data[idx].incomeBonus += r.amount
      else if (r.type === 'Expense') {
        const cid = r.category?.id ?? -1
        data[idx].expenses[cid] = (data[idx].expenses[cid] ?? 0) + r.amount
      }
    }
    return data
  }, [records])

  /* ── Nombre de categorías ── */
  const catName = useMemo(() => {
    const map: Record<number, string> = {}
    for (const c of categories) map[c.id] = c.name
    for (const r of records) if (r.category) map[r.category.id] = r.category.name
    return map
  }, [categories, records])

  /* ── IDs de categorías con gasto real ── */
  const activeCatIds = useMemo(() => {
    const ids = new Set<number>()
    for (const d of monthlyData) for (const k of Object.keys(d.expenses)) {
      const cid = parseInt(k)
      if (cid !== -1) ids.add(cid)
    }
    return ids
  }, [monthlyData])

  /* ── Map categoría → groupId ── */
  const catGroupId = useMemo(() => {
    const m: Record<number, number> = {}
    if (Array.isArray(groups)) {
      for (const g of groups) {
        if (Array.isArray(g.categoryIds)) {
          for (const cid of g.categoryIds) m[cid] = g.id
        }
      }
    }
    return m
  }, [groups])

  /* ── Categorías sin grupo ── */
  const ungroupedCatIds = useMemo(() =>
    [...activeCatIds]
      .filter((cid) => !catGroupId[cid])
      .sort((a, b) => (catName[a] ?? '').localeCompare(catName[b] ?? '')),
    [activeCatIds, catGroupId, catName]
  )

  /* ── Helpers de consulta ── */
  const getCatMonth = (cid: number, idx: number) => monthlyData[idx]?.expenses[cid] ?? 0
  const getGroupMonth = (g: CategoryGroup, idx: number) => 
    Array.isArray(g.categoryIds) ? g.categoryIds.reduce((s, cid) => s + getCatMonth(cid, idx), 0) : 0
  const getMonthIncome = (idx: number) => monthlyData[idx].incomeNormal + monthlyData[idx].incomeBonus
  const getMonthExpenses = (idx: number) => Object.values(monthlyData[idx].expenses).reduce((s, v) => s + v, 0)

  /* ── Totales anuales ── */
  const catAnnual = useMemo(() => {
    const t: Record<number, number> = {}
    for (const d of monthlyData) for (const [cs, v] of Object.entries(d.expenses)) {
      const cid = parseInt(cs); t[cid] = (t[cid] ?? 0) + v
    }
    return t
  }, [monthlyData])

  const groupAnnual = useMemo(() => {
    const t: Record<number, number> = {}
    if (Array.isArray(groups)) {
      for (const g of groups) {
        t[g.id] = Array.isArray(g.categoryIds) ? g.categoryIds.reduce((s, cid) => s + (catAnnual[cid] ?? 0), 0) : 0
      }
    }
    return t
  }, [groups, catAnnual])

  const annualIncome = useMemo(() => monthlyData.reduce((s, d) => s + d.incomeNormal + d.incomeBonus, 0), [monthlyData])
  const annualExpenses = useMemo(() => monthlyData.reduce((s, d) => s + Object.values(d.expenses).reduce((ss, v) => ss + v, 0), 0), [monthlyData])
  const annualSavings = annualIncome - annualExpenses

  const hasUncategorized = monthlyData.some((d) => (d.expenses[-1] ?? 0) > 0)

  /* ── Datos para análisis % ── */
  const analysisData = useMemo(() => {
    const idxs = analysisMonth !== null ? [analysisMonth - 1] : Array.from({ length: 12 }, (_, i) => i)
    const income = idxs.reduce((s, i) => s + getMonthIncome(i), 0)
    const expenses = idxs.reduce((s, i) => s + getMonthExpenses(i), 0)
    const months = analysisMonth !== null ? 1 : 12

    const getCatAmt = (cid: number) => idxs.reduce((s, i) => s + getCatMonth(cid, i), 0)

    const groupData = groups.map((g) => ({
      group: g,
      amount: idxs.reduce((s, i) => s + getGroupMonth(g, i), 0),
      ideal: (g.monthlyIdeal ?? 0) * months,
    }))
    const ungroupedData = ungroupedCatIds.map((cid) => ({
      cid, amount: getCatAmt(cid), ideal: 0,
    }))
    const uncatAmount = idxs.reduce((s, i) => s + getCatMonth(-1, i), 0)

    return { income, expenses, groupData, ungroupedData, uncatAmount, getCatAmt, months }
  }, [analysisMonth, monthlyData, groups, ungroupedCatIds])

  const IDX = Array.from({ length: 12 }, (_, i) => i)

  return (
    <BaseLayout titleHeader='Panorama'>
      <p className='text-sm text-text-muted -mt-2 mb-5'>
        Vista anual completa de ingresos, gastos y ahorro, con análisis porcentual por grupos de presupuesto.
      </p>

      {/* ── Selectores ── */}
      <div className='flex items-center justify-between gap-4 flex-wrap mb-5'>
        <select
          value={selectedYearId ?? ''}
          onChange={(e) => setSelectedYearId(e.target.value ? Number(e.target.value) : null)}
          className='h-9 appearance-none rounded-xl border border-secondary-200 bg-white pl-3 pr-8 text-sm font-medium text-text-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all'
        >
          <option value=''>— Selecciona un año —</option>
          {fiscalYears.map((y) => <option key={y.id} value={y.id}>{y.year}</option>)}
        </select>

        {/* Tabs */}
        <div className='flex items-center bg-secondary-100 rounded-xl p-1 gap-1'>
          <button
            onClick={() => setTab('table')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              tab === 'table' ? 'bg-white text-text-main shadow-sm' : 'text-text-muted hover:text-text-main'
            }`}
          >
            <LayoutGrid size={14} />
            Tabla anual
          </button>
          <button
            onClick={() => setTab('analysis')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              tab === 'analysis' ? 'bg-white text-text-main shadow-sm' : 'text-text-muted hover:text-text-main'
            }`}
          >
            <BarChart3 size={14} />
            Análisis %
          </button>
        </div>
      </div>

      {!selectedYearId ? (
        <div className='bg-white rounded-2xl border border-secondary-100 p-14 text-center'>
          <LayoutGrid size={32} className='text-secondary-200 mx-auto mb-3' />
          <p className='text-sm text-text-muted'>Selecciona un año para ver el panorama.</p>
        </div>
      ) : loading ? (
        <div className='flex justify-center py-16'>
          <div className='w-7 h-7 border-2 border-primary/30 border-t-primary rounded-full animate-spin' />
        </div>
      ) : tab === 'table' ? (
        /* ══════════════════════════════════════════════
           TABLA ANUAL
        ══════════════════════════════════════════════ */
        <div className='bg-white rounded-2xl border border-secondary-100 overflow-hidden'>
          <div className='overflow-x-auto'>
            <table className='min-w-full text-xs border-collapse'>
              {/* HEADER */}
              <thead>
                <tr className='border-b border-secondary-200'>
                  <th className='sticky left-0 z-20 bg-secondary-50 text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-text-muted border-r border-secondary-200 w-44 min-w-[11rem]'>
                    Concepto
                  </th>
                  {MS.map((m) => (
                    <th key={m} className='px-2 py-3 text-[10px] font-bold uppercase tracking-wider text-text-muted text-right min-w-[72px]'>
                      {m}
                    </th>
                  ))}
                  <th className='px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-text-muted text-right min-w-[84px] border-l border-secondary-200'>
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* ── INGRESOS ── */}
                <SectionHeader label='Ingresos' color='green' />
                <tr className='hover:bg-secondary-50 transition-colors'>
                  <td className='sticky left-0 z-10 bg-white px-4 py-1.5 text-text-main border-r border-secondary-100'>Normal</td>
                  {IDX.map((i) => <TCell key={i} value={monthlyData[i].incomeNormal} muted />)}
                  <td className='px-3 py-1.5 text-right font-semibold text-text-main border-l border-secondary-100 tabular-nums'>
                    {fmtShort(monthlyData.reduce((s, d) => s + d.incomeNormal, 0))}
                  </td>
                </tr>
                <tr className='hover:bg-secondary-50 transition-colors'>
                  <td className='sticky left-0 z-10 bg-white px-4 py-1.5 text-text-main border-r border-secondary-100'>Extra / Bono</td>
                  {IDX.map((i) => <TCell key={i} value={monthlyData[i].incomeBonus} muted />)}
                  <td className='px-3 py-1.5 text-right font-semibold text-text-main border-l border-secondary-100 tabular-nums'>
                    {fmtShort(monthlyData.reduce((s, d) => s + d.incomeBonus, 0))}
                  </td>
                </tr>
                <tr className='bg-success/5'>
                  <td className='sticky left-0 z-10 bg-success/5 px-4 py-2 font-bold text-success border-r border-secondary-100'>Total ingresos</td>
                  {IDX.map((i) => {
                    const v = getMonthIncome(i)
                    return <td key={i} className={`px-2 py-2 text-right font-bold tabular-nums ${v > 0 ? 'text-success' : 'text-secondary-300'}`}>{v === 0 ? '—' : fmtShort(v)}</td>
                  })}
                  <td className='px-3 py-2 text-right font-bold text-success border-l border-secondary-100 tabular-nums'>{fmtShort(annualIncome)}</td>
                </tr>

                {/* Spacer */}
                <tr><td colSpan={15} className='py-px bg-secondary-100' /></tr>

                {/* ── GASTOS ── */}
                <SectionHeader label='Gastos' color='red' />

                {/* Grupos */}
                {Array.isArray(groups) && groups.map((g) => {
                  const groupCats = Array.isArray(g.categoryIds) ? g.categoryIds.filter((cid) => activeCatIds.has(cid)) : []
                  if (groupCats.length === 0 && !groupAnnual[g.id]) return null
                  return (
                    <React.Fragment key={g.id}>
                      <tr className='bg-secondary-50/80'>
                        <td className='sticky left-0 z-10 bg-secondary-50 px-4 py-1.5 font-semibold text-text-main border-r border-secondary-100'>
                          {g.name}
                        </td>
                        {IDX.map((i) => {
                          const v = getGroupMonth(g, i)
                          return <td key={i} className={`px-2 py-1.5 text-right font-semibold tabular-nums ${v > 0 ? 'text-text-main' : 'text-secondary-300'}`}>{v === 0 ? '—' : fmtShort(v)}</td>
                        })}
                        <td className='px-3 py-1.5 text-right font-bold text-text-main border-l border-secondary-100 tabular-nums'>
                          {fmtShort(groupAnnual[g.id] ?? 0)}
                        </td>
                      </tr>
                      {groupCats.map((cid) => (
                        <tr key={cid} className='hover:bg-secondary-50 transition-colors'>
                          <td className='sticky left-0 z-10 bg-white pl-7 pr-4 py-1.5 text-text-muted border-r border-secondary-100'>
                            {catName[cid] ?? `Cat ${cid}`}
                          </td>
                          {IDX.map((i) => <TCell key={i} value={getCatMonth(cid, i)} muted />)}
                          <td className='px-3 py-1.5 text-right text-text-muted border-l border-secondary-100 tabular-nums'>
                            {fmtShort(catAnnual[cid] ?? 0)}
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  )
                })}

                {/* Categorías sin grupo */}
                {ungroupedCatIds.map((cid) => (
                  <tr key={cid} className='hover:bg-secondary-50 transition-colors'>
                    <td className='sticky left-0 z-10 bg-white px-4 py-1.5 text-text-main border-r border-secondary-100'>
                      {catName[cid] ?? `Cat ${cid}`}
                    </td>
                    {IDX.map((i) => <TCell key={i} value={getCatMonth(cid, i)} />)}
                    <td className='px-3 py-1.5 text-right font-semibold text-text-main border-l border-secondary-100 tabular-nums'>
                      {fmtShort(catAnnual[cid] ?? 0)}
                    </td>
                  </tr>
                ))}

                {/* Sin categoría */}
                {hasUncategorized && (
                  <tr className='hover:bg-secondary-50 transition-colors'>
                    <td className='sticky left-0 z-10 bg-white px-4 py-1.5 text-text-muted italic border-r border-secondary-100'>Sin categoría</td>
                    {IDX.map((i) => <TCell key={i} value={getCatMonth(-1, i)} muted />)}
                    <td className='px-3 py-1.5 text-right text-text-muted border-l border-secondary-100 tabular-nums'>
                      {fmtShort(catAnnual[-1] ?? 0)}
                    </td>
                  </tr>
                )}

                {/* Total gastos */}
                <tr className='bg-danger/5'>
                  <td className='sticky left-0 z-10 bg-danger/5 px-4 py-2 font-bold text-danger border-r border-secondary-100'>Total gastos</td>
                  {IDX.map((i) => {
                    const v = getMonthExpenses(i)
                    return <td key={i} className={`px-2 py-2 text-right font-bold tabular-nums ${v > 0 ? 'text-danger' : 'text-secondary-300'}`}>{v === 0 ? '—' : fmtShort(v)}</td>
                  })}
                  <td className='px-3 py-2 text-right font-bold text-danger border-l border-secondary-100 tabular-nums'>{fmtShort(annualExpenses)}</td>
                </tr>

                {/* Spacer */}
                <tr><td colSpan={15} className='py-px bg-secondary-100' /></tr>

                {/* Ahorro */}
                <tr className={annualSavings >= 0 ? 'bg-success/5' : 'bg-danger/5'}>
                  <td className={`sticky left-0 z-10 px-4 py-2.5 font-bold border-r border-secondary-100 ${annualSavings >= 0 ? 'bg-success/5 text-success' : 'bg-danger/5 text-danger'}`}>
                    Ahorro / Déficit
                  </td>
                  {IDX.map((i) => {
                    const inc = getMonthIncome(i); const exp = getMonthExpenses(i)
                    const v = inc - exp
                    if (inc === 0 && exp === 0) return <td key={i} className='px-2 py-2.5 text-right text-secondary-300'>—</td>
                    return (
                      <td key={i} className={`px-2 py-2.5 text-right font-bold tabular-nums ${v >= 0 ? 'text-success' : 'text-danger'}`}>
                        {fmtShort(v)}
                      </td>
                    )
                  })}
                  <td className={`px-3 py-2.5 text-right font-bold border-l border-secondary-100 tabular-nums ${annualSavings >= 0 ? 'text-success' : 'text-danger'}`}>
                    {fmtShort(annualSavings)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ══════════════════════════════════════════════
           ANÁLISIS %
        ══════════════════════════════════════════════ */
        <div className='flex flex-col gap-5'>
          {/* Filtro de mes */}
          <div className='flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar'>
            <button
              onClick={() => setAnalysisMonth(null)}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all ${
                analysisMonth === null ? 'bg-text-main text-white' : 'bg-white border border-secondary-200 text-text-muted hover:border-primary hover:text-primary'
              }`}
            >
              Año completo
            </button>
            {MONTHS_FULL.map((m, i) => (
              <button
                key={i}
                onClick={() => setAnalysisMonth(i + 1)}
                className={`flex-shrink-0 px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all ${
                  analysisMonth === i + 1 ? 'bg-text-main text-white' : 'bg-white border border-secondary-200 text-text-muted hover:border-primary hover:text-primary'
                }`}
              >
                {m.slice(0, 3)}
              </button>
            ))}
          </div>

          {/* Resumen del período */}
          <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
            <div className='bg-white rounded-2xl border border-secondary-100 p-4 flex items-center gap-3'>
              <div className='w-10 h-10 bg-success/10 rounded-xl flex items-center justify-center flex-shrink-0'>
                <TrendingUp size={18} className='text-success' />
              </div>
              <div>
                <p className='text-xs text-text-muted font-medium'>Ingresos</p>
                <p className='text-lg font-bold text-success'>{fmt(analysisData.income)}</p>
              </div>
            </div>
            <div className='bg-white rounded-2xl border border-secondary-100 p-4 flex items-center gap-3'>
              <div className='w-10 h-10 bg-danger/10 rounded-xl flex items-center justify-center flex-shrink-0'>
                <TrendingDown size={18} className='text-danger' />
              </div>
              <div>
                <p className='text-xs text-text-muted font-medium'>Gastos</p>
                <p className='text-lg font-bold text-danger'>{fmt(analysisData.expenses)}</p>
              </div>
            </div>
            {(() => {
              const s = analysisData.income - analysisData.expenses
              const pct = analysisData.income > 0 ? ((s / analysisData.income) * 100).toFixed(1) : null
              return (
                <div className='bg-white rounded-2xl border border-secondary-100 p-4 flex items-center gap-3'>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${s >= 0 ? 'bg-primary/10' : 'bg-danger/10'}`}>
                    <Wallet size={18} className={s >= 0 ? 'text-primary' : 'text-danger'} />
                  </div>
                  <div>
                    <p className='text-xs text-text-muted font-medium'>Ahorro</p>
                    <p className={`text-lg font-bold ${s >= 0 ? 'text-primary' : 'text-danger'}`}>
                      {fmt(s)}
                      {pct !== null && <span className='text-xs font-normal text-text-muted ml-1'>({pct}%)</span>}
                    </p>
                  </div>
                </div>
              )
            })()}
          </div>

          {/* Desglose */}
          {analysisData.income > 0 || analysisData.expenses > 0 ? (
            <div className='flex flex-col gap-3 max-w-2xl'>
              {/* Grupos */}
              {analysisData.groupData.map(({ group, amount, ideal }) => (
                <GroupAnalysisCard
                  key={group.id}
                  group={group}
                  amount={amount}
                  ideal={ideal}
                  income={analysisData.income}
                  categories={catName}
                  catAnnual={catAnnual}
                  catMonths={(cid) => analysisData.getCatAmt(cid)}
                />
              ))}

              {/* Categorías sin grupo */}
              {analysisData.ungroupedData.map(({ cid, amount, ideal }) => (
                <div key={cid} className='bg-white rounded-2xl border border-secondary-100 p-4'>
                  <AnalysisBar
                    name={catName[cid] ?? `Cat ${cid}`}
                    amount={amount}
                    ideal={ideal}
                    income={analysisData.income}
                  />
                </div>
              ))}

              {/* Sin categoría */}
              {analysisData.uncatAmount > 0 && (
                <div className='bg-white rounded-2xl border border-secondary-100 p-4'>
                  <AnalysisBar
                    name='Sin categoría'
                    amount={analysisData.uncatAmount}
                    ideal={0}
                    income={analysisData.income}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className='bg-white rounded-2xl border border-secondary-100 p-14 text-center'>
              <BarChart3 size={32} className='text-secondary-200 mx-auto mb-3' />
              <p className='text-sm text-text-muted'>
                Sin datos para {analysisMonth !== null ? MONTHS_FULL[analysisMonth - 1] : 'este año'}.
              </p>
            </div>
          )}
        </div>
      )}
    </BaseLayout>
  )
}
