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
          className="bg-gradient-to-br from-primary to-primary-dark rounded-2xl p-6 text-white shadow-lg relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-20">
            <Wallet size={64} />
          </div>
          <h3 className="text-secondary-100 font-medium mb-2 opacity-90">Total Expenses</h3>
          <p className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-200">
            ${totalAmount.toFixed(2)}
          </p>
          <div className="mt-4 flex items-center gap-2 text-sm opacity-80">
            <ArrowUpRight size={16} />
            <span>+12% vs last month</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={cn(
            "rounded-2xl p-6 text-white shadow-lg relative overflow-hidden",
            pendingSync > 0 ? "bg-gradient-to-br from-warning to-warning-dark" : "bg-gradient-to-br from-success to-success-dark"
          )}
        >
          <div className="absolute top-0 right-0 p-4 opacity-20">
            {pendingSync > 0 ? <Clock size={64} /> : <CheckCircle2 size={64} />}
          </div>
          <h3 className="font-medium mb-2 opacity-90">Sync Status</h3>
          <p className="text-4xl font-bold">
            {pendingSync > 0 ? `${pendingSync} Pending` : "All Synced"}
          </p>
          <div className="mt-4 text-sm opacity-80">
            {pendingSync > 0 ? "Go online to sync" : "You are up to date"}
          </div>
        </motion.div>
      </div>

      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gradient">Recent Activity</h2>
          <Button variant="link" onClick={() => navigate('/invoices')}>View All</Button>
        </div>

        <div className="bg-white dark:bg-tertiary-dark rounded-xl shadow-sm border border-border overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading activity...</div>
          ) : invoices.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No recent activity</div>
          ) : (
            invoices.slice(0, 5).map((inv, i) => (
              <motion.div
                key={inv.id ?? i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-4 border-b border-gray-100 dark:border-gray-800 last:border-0 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                onClick={() => navigate('/invoices')}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary font-bold">
                    {inv.category?.[0] || 'G'}
                  </div>
                  <div>
                    <h4 className="font-semibold text-dark dark:text-light">{inv.description}</h4>
                    <p className="text-xs text-gray-500">{new Date(inv.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="font-bold text-dark dark:text-light">
                  -${Number(inv.amount).toFixed(2)}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <Button onClick={() => navigate('/invoices')} className="bg-gradient-primary text-white shadow-lg hover:translate-y-[-2px] transition-transform">
          Manage Invoices
        </Button>
      </div>
    </BaseLayout>
  )
}
