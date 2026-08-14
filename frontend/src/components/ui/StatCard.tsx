import { IconType } from "react-icons";
import { motion } from "framer-motion";

export default function StatCard({
  label,
  value,
  icon: Icon,
  trend,
}: {
  label: string;
  value: string | number;
  icon: IconType;
  trend?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="stat-card"
    >
      <div className="flex items-center justify-between">
        <span className="text-ink-500 text-sm">{label}</span>
        <div className="w-9 h-9 rounded-lg bg-brand-gradient/20 grid place-items-center">
          <Icon className="text-brand-blue" />
        </div>
      </div>
      <div className="text-2xl font-bold font-display">{value}</div>
      {trend && <span className="text-xs text-accent-success">{trend}</span>}
    </motion.div>
  );
}
