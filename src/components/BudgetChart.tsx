import { BudgetSummary } from '@/lib/budget-types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = [
  'hsl(210,60%,65%)', 'hsl(45,80%,70%)', 'hsl(150,40%,60%)',
  'hsl(340,50%,70%)', 'hsl(280,30%,65%)', 'hsl(20,60%,65%)',
];

function formatM(n: number) {
  if (n >= 10000) return (n / 10000).toFixed(0) + '만';
  if (n >= 1000) return (n / 1000).toFixed(0) + '천';
  return n.toString();
}

interface Props {
  summary: BudgetSummary;
}

export default function BudgetChart({ summary }: Props) {
  const data = summary.categoryBreakdown.map(c => ({
    name: c.name.length > 8 ? c.name.slice(0, 8) + '…' : c.name,
    예산: c.budget,
    집행: c.executed,
    잔액: c.remaining,
  }));

  if (data.length === 0) return null;

  return (
    <div className="glass-card rounded-xl p-5">
      <h3 className="text-base font-semibold text-foreground mb-4">사업별 예산 현황</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 40 }}>
          <XAxis dataKey="name" angle={-30} textAnchor="end" fontSize={11} tick={{ fill: 'hsl(220,15%,50%)' }} />
          <YAxis tickFormatter={formatM} fontSize={11} tick={{ fill: 'hsl(220,15%,50%)' }} />
          <Tooltip
            formatter={(value: number) => value.toLocaleString('ko-KR') + '원'}
            contentStyle={{ borderRadius: '8px', border: '1px solid hsl(210,25%,88%)', fontSize: '13px' }}
          />
          <Bar dataKey="예산" radius={[4, 4, 0, 0]}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} fillOpacity={0.7} />)}
          </Bar>
          <Bar dataKey="집행" radius={[4, 4, 0, 0]}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} fillOpacity={1} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
