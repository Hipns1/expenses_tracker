import { BaseLayout } from '@/components/shared/base-layout'
import { useInvoices } from '@/hooks/use-invoices'
import { Button } from '@/components/ui'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Wallet, ArrowUpRight, Clock, CheckCircle2 } from 'lucide-react'
import { cn } from '@/utils'

export default function Home() {
  const { invoices, loading } = useInvoices()
  const navigate = useNavigate()

  const totalAmount = invoices.reduce((acc, curr) => acc + Number(curr.amount), 0)
  const pendingSync = invoices.filter(i => !i.synced).length

  return (
    <BaseLayout titleHeader="Dashboard">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-primary rounded-2xl p-6 text-white shadow-lg relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-110 transition-transform duration-500">
            <Wallet size={64} />
          </div>
          <h3 className="text-primary-100 font-medium mb-2 opacity-90">Total Expenses</h3>
          <p className="text-4xl font-bold text-white">
            ${totalAmount.toFixed(2)}
          </p>
          <div className="mt-4 flex items-center gap-2 text-sm opacity-90 font-medium">
            <ArrowUpRight size={16} />
            <span>+12% vs last month</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={cn(
            "rounded-2xl p-6 text-white shadow-lg relative overflow-hidden group",
            pendingSync > 0 ? "bg-gradient-to-br from-warning to-warning-dark" : "bg-gradient-to-br from-success to-success-dark"
          )}
        >
          <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:rotate-12 transition-transform duration-500">
            {pendingSync > 0 ? <Clock size={64} /> : <CheckCircle2 size={64} />}
          </div>
          <h3 className="font-medium mb-2 opacity-90">Sync Status</h3>
          <p className="text-4xl font-bold">
            {pendingSync > 0 ? `${pendingSync} Pending` : "All Synced"}
          </p>
          <div className="mt-4 text-sm opacity-90 font-medium">
            {pendingSync > 0 ? "Go online to sync" : "You are up to date"}
          </div>
        </motion.div>
      </div>

      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gradient">Recent Activity</h2>
          <Button variant="link" onClick={() => navigate('/invoices')} className="text-primary hover:text-primary-dark">View All</Button>
        </div>

        <div className="bg-card-light dark:bg-card-dark rounded-2xl shadow-sm border border-secondary-100 dark:border-secondary-dark overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-text-muted">Loading activity...</div>
          ) : invoices.length === 0 ? (
            <div className="p-12 text-center text-text-muted flex flex-col items-center">
              <div className="w-16 h-16 bg-secondary-100 dark:bg-bg-dark rounded-full flex items-center justify-center mb-4 text-secondary">
                <Wallet size={24} />
              </div>
              <p>No recent activity</p>
              <Button variant="link" onClick={() => navigate('/invoices')} className="mt-2">Add Expense</Button>
            </div>
          ) : (
            invoices.slice(0, 5).map((inv, i) => (
              <motion.div
                key={inv.id ?? i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-5 border-b border-secondary-100 dark:border-secondary-dark last:border-0 flex justify-between items-center hover:bg-bg-light dark:hover:bg-bg-dark/50 transition-colors cursor-pointer group"
                onClick={() => navigate('/invoices')}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center text-primary font-bold text-lg group-hover:scale-110 transition-transform">
                    {inv.category?.[0]?.toUpperCase() || 'G'}
                  </div>
                  <div>
                    <h4 className="font-semibold text-text-main dark:text-white group-hover:text-primary transition-colors">{inv.description}</h4>
                    <p className="text-xs text-text-muted">{new Date(inv.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="font-bold text-text-main dark:text-white">
                  -${Number(inv.amount).toFixed(2)}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <Button
          onClick={() => navigate('/invoices')}
          className="bg-gradient-primary text-white shadow-lg hover:shadow-glow hover:-translate-y-1 transition-all px-8 py-6 text-lg rounded-xl font-bold"
        >
          Manage Invoices
        </Button>
      </div>
    </BaseLayout>
  )
}
