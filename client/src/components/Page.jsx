import { motion } from 'framer-motion';

export default function Page({ children, className = '' }) {
  return (
    <motion.main className={className} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      {children}
    </motion.main>
  );
}
