import { motion } from 'framer-motion';

export default function Page({ children, className = '' }) {
  return (
    <motion.main className={className} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.main>
  );
}
