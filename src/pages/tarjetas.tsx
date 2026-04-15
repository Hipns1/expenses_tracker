import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { CreditCard, Trash2, Settings, ChevronDown, ChevronUp } from 'lucide-react'
import { BaseLayout } from '@/components/shared/base-layout'
import { creditCardsService, type CreditCard as CreditCardType } from '@/services/creditCards'
import { cardExpensesService, type CardExpense } from '@/services/cardExpenses'

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })

interface CardWithExpenses {
  card: CreditCardType
  expenses: CardExpense[]
  loading: boolean
  expanded: boolean
}

export default function Tarjetas() {
  const navigate = useNavigate()
  const [cards, setCards] = useState<CardWithExpenses[]>([])
  const [loadingCards, setLoadingCards] = useState(true)

  useEffect(() => {
    creditCardsService.getAll().then((creditCards) => {
      setCards(creditCards.map(card => ({ card, expenses: [], loading: true, expanded: false })))
      setLoadingCards(false)

      // Load expenses for each card
      creditCards.forEach(card => {
        cardExpensesService.getByCard(card.id).then(expenses => {
          setCards(prev => prev.map(c =>
            c.card.id === card.id ? { ...c, expenses, loading: false } : c
          ))
        }).catch(() => {
          setCards(prev => prev.map(c =>
            c.card.id === card.id ? { ...c, loading: false } : c
          ))
        })
      })
    }).catch(() => setLoadingCards(false))
  }, [])

  const handleDeleteExpense = async (cardId: number, expenseId: number) => {
    await cardExpensesService.delete(expenseId)
    setCards(prev => prev.map(c =>
      c.card.id === cardId
        ? { ...c, expenses: c.expenses.filter(e => e.id !== expenseId) }
        : c
    ))
  }

  const toggleExpand = (cardId: number) => {
    setCards(prev => prev.map(c =>
      c.card.id === cardId ? { ...c, expanded: !c.expanded } : c
    ))
  }

  if (loadingCards) {
    return (
      <BaseLayout titleHeader="Tarjetas">
        <div className="text-sm text-text-muted">Cargando tarjetas...</div>
      </BaseLayout>
    )
  }

  if (cards.length === 0) {
    return (
      <BaseLayout titleHeader="Tarjetas">
        <div className="bg-card-light dark:bg-card-dark rounded-2xl p-10 border border-secondary-100 dark:border-secondary-dark flex flex-col items-center gap-4 text-text-muted">
          <CreditCard size={40} className="opacity-30" />
          <div className="text-center">
            <p className="text-sm font-medium">No tienes tarjetas de crédito registradas.</p>
            <p className="text-xs mt-1">Primero crea una tarjeta en Configuración.</p>
          </div>
          <button
            onClick={() => navigate('/configuracion')}
            className="flex items-center gap-2 text-sm text-primary font-medium hover:underline"
          >
            <Settings size={15} />
            Ir a Configuración
          </button>
        </div>
      </BaseLayout>
    )
  }

  return (
    <BaseLayout titleHeader="Tarjetas">
      <div className="flex flex-col gap-4">
        {cards.map(({ card, expenses, loading, expanded }) => {
          const total = expenses.reduce((s, e) => s + e.amount, 0)

          return (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card-light dark:bg-card-dark rounded-2xl border border-secondary-100 dark:border-secondary-dark shadow-sm overflow-hidden"
            >
              {/* Card header */}
              <button
                onClick={() => toggleExpand(card.id)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-bg-light dark:hover:bg-bg-dark/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <CreditCard size={20} className="text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-text-main dark:text-white">{card.name}</p>
                    <p className="text-xs text-text-muted">•••• {card.lastFourDigits}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xs text-text-muted">Total pendiente</p>
                    <p className="text-sm font-bold text-danger">{loading ? '...' : formatCurrency(total)}</p>
                  </div>
                  {expanded ? <ChevronUp size={16} className="text-text-muted" /> : <ChevronDown size={16} className="text-text-muted" />}
                </div>
              </button>

              {/* Expenses list */}
              <AnimatePresence>
                {expanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden border-t border-secondary-100 dark:border-secondary-dark"
                  >
                    {loading ? (
                      <div className="px-5 py-4 text-sm text-text-muted">Cargando gastos...</div>
                    ) : expenses.length === 0 ? (
                      <div className="px-5 py-6 text-sm text-text-muted text-center">
                        Sin gastos registrados para esta tarjeta.
                      </div>
                    ) : (
                      <ul>
                        {expenses.map(expense => (
                          <li
                            key={expense.id}
                            className="flex items-center justify-between px-5 py-3 border-b border-secondary-100 dark:border-secondary-dark last:border-0 hover:bg-bg-light dark:hover:bg-bg-dark/40 transition-colors group"
                          >
                            <div>
                              <p className="text-sm font-medium text-text-main dark:text-white">{expense.description}</p>
                              <p className="text-xs text-text-muted">{formatDate(expense.date)}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-semibold text-text-main dark:text-white">
                                {formatCurrency(expense.amount)}
                              </span>
                              <button
                                onClick={() => handleDeleteExpense(card.id, expense.id)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg text-secondary-400 hover:text-danger hover:bg-danger/10"
                                title="Eliminar gasto"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>
    </BaseLayout>
  )
}
