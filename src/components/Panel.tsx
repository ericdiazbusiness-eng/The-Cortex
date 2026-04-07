import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

type PanelProps = {
  title?: string
  eyebrow?: string
  className?: string
  children: ReactNode
}

export const Panel = ({ title, eyebrow, className = '', children }: PanelProps) => (
  <motion.section
    className={`cortex-panel ${className}`.trim()}
    initial={{ opacity: 0, y: 22 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.45, ease: 'easeOut' }}
  >
    {(eyebrow || title) && (
      <header className="panel-header">
        {eyebrow ? <p className="panel-eyebrow">{eyebrow}</p> : null}
        {title ? <h2>{title}</h2> : null}
      </header>
    )}
    {children}
  </motion.section>
)
