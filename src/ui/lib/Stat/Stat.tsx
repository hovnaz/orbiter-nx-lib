import s from './Stat.module.css';

export interface StatProps {
  label: string;
  value: string;
  sub?: string;
}

export function Stat({ label, value, sub }: StatProps) {
  return (
    <div>
      <div className={s.label}>{label}</div>
      <div className={s.value}>{value}</div>
      {sub && <div className={s.sub}>{sub}</div>}
    </div>
  );
}
