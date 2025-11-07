'use client'

import { motion } from 'framer-motion'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen">
      <aside className="w-64 bg-deep-blue text-white">
        {/* Sidebar content */}
        <p>Sidebar</p>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="bg-deep-blue p-4 text-white">
          {/* Topbar content */}
          <p>Topbar</p>
        </header>
        <motion.main
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex-1 p-4"
        >
          {children}
        </motion.main>
      </div>
    </div>
  )
}
