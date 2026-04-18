import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Target, Loader2, TrendingDown, Calendar, Wallet } from 'lucide-react'
import { BaseLayout } from '@/components/shared/base-layout'
import { fiscalYearsService, type FiscalYear } from '@/services/fiscalYears'
import { categoriesService, type Category } from '@/services/categories'
import { categoryGroupsService, type CategoryGroup } from '@/services/categoryGroups'
import { recordsService } from '@/services/records'

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

export default function Presupuesto() {
  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>([])
  const [selectedYearId, setSelectedYearId] = useState<number | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1)
  
  const [groups, setGroups] = useState<CategoryGroup[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [spentByGroup, setSpentByGroup] = useState<Record<number, number>>({})
  const [loading, setLoading] = useState(true)

  /* ── Carga inicial ── */
  useEffect(() => {
    Promise.all([
      fiscalYearsService.getAll(),
      categoryGroupsService.getAll(),
      categoriesService.getAll()
    ]).then(([years, gs, cats]) => {
      const sorted = [...years].sort((a, b) => b.year - a.year)
      setFiscalYears(sorted)
      if (sorted.length > 0) setSelectedYearId(sorted[0].id)
      setGroups(gs || [])
      setCategories(cats || [])
    }).catch(() => {})
  }, [])

  /* ── Carga de gastos reales por grupo ── */
  useEffect(() => {
    if (!selectedYearId || groups.length === 0) {
        setLoading(false)
        return
    }
    setLoading(true)

    recordsService.getByYear(selectedYearId, selectedMonth)
      .then((records: any) => {
        const mapping: Record<number, number> = {}
        groups.forEach(g => mapping[g.id] = 0)

        // Sumar gastos reales agrupados por la categoría del registro
        records.forEach((rec: any) => {
           const cat = categories.find(c => c.id === rec.categoryId)
           if (cat && cat.categoryGroupId) {
              mapping[cat.categoryGroupId] = (mapping[cat.categoryGroupId] || 0) + rec.amount
           }
        })
        setSpentByGroup(mapping)
      })
      .finally(() => setLoading(false))
  }, [selectedYearId, selectedMonth, groups, categories])

  /* ── Cálculos Globales ── */
  const totalMonthlyIdeal = groups.reduce((acc, g) => acc + (g.monthlyIdeal || 0), 0)
  const totalMonthlySpent = Object.values(spentByGroup).reduce((acc, v) => acc + v, 0)
  const annualProjection = totalMonthlyIdeal * 12
  
  const executionPct = totalMonthlyIdeal > 0 
    ? Math.round((totalMonthlySpent / totalMonthlyIdeal) * 100) 
    : 0

  const balance = totalMonthlyIdeal - totalMonthlySpent

  return (
    <BaseLayout titleHeader='Planificación Presupuestaria'>
      <div className='max-w-5xl mx-auto pb-10'>
        <p className='text-sm text-text-muted mb-6'>
          Este panel analiza la salud de tus finanzas comparando tus <strong>Ideales Mensuales</strong> por grupo contra el gasto real registrado.
        </p>

        {/* ── Selectores año ── */}
        <div className='flex items-center gap-3 mb-6'>
          <div className='flex items-center gap-2 bg-white border border-secondary-100 px-3 py-1.5 rounded-xl'>
             <Calendar size={14} className='text-secondary-400' />
             <select
                value={selectedYearId ?? ''}
                onChange={(e) => setSelectedYearId(Number(e.target.value))}
                className='bg-transparent text-sm font-bold text-text-main focus:outline-none'
             >
                {fiscalYears.map((y) => (
                    <option key={y.id} value={y.id}>Año {y.year}</option>
                ))}
             </select>
          </div>
        </div>

        {/* ── Dashboard de Resumen ── */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className='bg-text-main text-white rounded-2xl p-6 shadow-sm relative overflow-hidden'
          >
            <div className='relative z-10'>
                <p className='text-xs text-primary-200 font-medium mb-1 uppercase tracking-wider'>Presupuesto Mensual</p>
                <span className='text-3xl font-bold'>{fmt(totalMonthlyIdeal)}</span>
                <p className='text-[10px] text-primary-300 mt-2 italic flex items-center gap-1'>
                    <Target size={10} /> Meta configurada en grupos
                </p>
            </div>
            <Target size={80} className='absolute -right-4 -bottom-4 text-white/5 rotate-12' />
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className='bg-white border border-secondary-100 rounded-2xl p-6 shadow-sm'
          >
            <p className='text-xs text-text-muted font-medium mb-1 uppercase tracking-wider'>Proyección Anual</p>
            <span className='text-2xl font-bold text-text-main'>{fmt(annualProjection)}</span>
            <p className='text-[10px] text-text-muted mt-2 font-medium'>PLAN PARA EL AÑO COMPLETO</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className='bg-white border border-secondary-100 rounded-2xl p-6 shadow-sm'
          >
            <p className='text-xs text-text-muted font-medium mb-1 uppercase tracking-wider'>Saldo del Mes</p>
            <span className={`text-2xl font-bold ${balance < 0 ? 'text-danger' : 'text-green-500'}`}>
              {fmt(balance)}
            </span>
            <p className='text-[10px] text-text-muted mt-2 font-medium'>
                {balance < 0 ? 'DÉFICIT SOBRE EL PLAN' : 'DENTRO DEL LÍMITE'}
            </p>
          </motion.div>
        </div>

        {/* ── Health Bar ── */}
        <div className='bg-white rounded-3xl border border-secondary-100 p-6 mb-8 shadow-sm'>
          <div className='flex items-center justify-between mb-4'>
            <div>
              <h3 className='text-base font-bold text-text-main'>Salud General del Mes</h3>
              <p className='text-xs text-text-muted'>Ejecución de {MONTHS[selectedMonth - 1]}</p>
            </div>
            <div className='text-right'>
                <span className={`text-2xl font-black ${executionPct > 100 ? 'text-danger' : 'text-primary'}`}>
                {executionPct}%
                </span>
                <p className='text-[10px] text-text-muted font-bold uppercase'>Consumido</p>
            </div>
          </div>
          <div className='h-4 bg-secondary-100 rounded-full overflow-hidden p-1'>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(executionPct, 100)}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className={`h-full rounded-full ${executionPct > 100 ? 'bg-danger' : 'bg-primary'}`}
            />
          </div>
        </div>

        {/* ── Selector de mes ── */}
        <div className='flex items-center gap-2 overflow-x-auto pb-4 no-scrollbar mb-4'>
          {MONTHS.map((m, i) => (
            <button
              key={i}
              onClick={() => setSelectedMonth(i + 1)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                selectedMonth === i + 1
                  ? 'bg-text-main text-white shadow-md'
                  : 'bg-white border border-secondary-200 text-text-muted hover:border-primary hover:text-primary'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        {/* ── Detalle de ejecución por Grupos ── */}
        <div className='flex items-center justify-between mb-4 mt-6'>
            <h3 className='text-sm font-bold text-text-main flex items-center gap-2'>
                <TrendingDown size={16} className='text-primary' /> Desglose por Grupos
            </h3>
            <span className='text-[10px] font-bold text-text-muted uppercase'>Real vs Ideal</span>
        </div>
        
        {loading ? (
          <div className='flex flex-col items-center justify-center py-20 bg-white/50 rounded-3xl border border-dashed border-secondary-200'>
            <Loader2 className='w-8 h-8 text-primary animate-spin mb-2' />
            <p className='text-xs text-text-muted font-medium'>Analizando gastos reales...</p>
          </div>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
             {groups.map((g, idx) => {
               const spent = spentByGroup[g.id] || 0
               const ideal = g.monthlyIdeal || 0
               const pct = ideal > 0 ? Math.min(100, Math.round((spent/ideal)*100)) : 0
               const isOver = spent > ideal && ideal > 0

               return (
                 <motion.div 
                    key={g.id} 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className='bg-white rounded-2xl border border-secondary-100 p-5 hover:border-primary/40 transition-all group'
                 >
                   <div className='flex items-center justify-between mb-3'>
                     <div className='flex items-center gap-2'>
                        <div className={`w-2 h-2 rounded-full ${isOver ? 'bg-danger' : 'bg-primary'}`} />
                        <span className='font-bold text-sm text-text-main group-hover:text-primary transition-colors'>{g.name}</span>
                     </div>
                     <div className='text-right'>
                        <p className='text-xs font-bold text-text-main'>{fmt(spent)}</p>
                        <p className='text-[10px] text-text-muted'>de {fmt(ideal)}</p>
                     </div>
                   </div>

                   <div className='h-2 bg-secondary-50 rounded-full overflow-hidden'>
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        className={`h-full rounded-full ${isOver ? 'bg-danger' : 'bg-primary/60'}`} 
                      />
                   </div>

                   <div className='flex justify-between mt-3'>
                      <div className='flex items-center gap-1.5'>
                        <Wallet size={12} className='text-secondary-400' />
                        <span className={`text-[11px] font-medium ${isOver ? 'text-danger' : 'text-text-muted'}`}>
                          {ideal > 0 ? (isOver ? `Excedido por ${fmt(spent - ideal)}` : `${fmt(ideal - spent)} disponibles`) : 'Sin ideal configurado'}
                        </span>
                      </div>
                      <span className={`text-xs font-black ${isOver ? 'text-danger' : 'text-primary'}`}>{pct}%</span>
                   </div>
                 </motion.div>
               )
             })}
          </div>
        )}
      </div>
    </BaseLayout>
  )
}
