import { Card, CardContent } from './ui/card.jsx';

// Shared "card full of mini-stats" pattern used across Dashboard, Reports,
// and the restyled Products/Orders headers. `tint` is a brand-safe hex
// (blue-600/green-600/amber-700/black-500 — never red, reserved as the
// app's single highlight signal per docs/09).
export default function StatCard({ title, action, items }) {
  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-bold text-black-900">{title}</h3>
          {action}
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-4">
          {items.map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <div
                className="flex size-10 shrink-0 items-center justify-center rounded"
                style={{ backgroundColor: `${item.tint}1A`, color: item.tint }}
              >
                <item.icon size={18} strokeWidth={2} />
              </div>
              <div>
                <p className="font-display text-lg text-black-900 tabular-nums">{item.value}</p>
                <p className="text-xs text-black-500">{item.label}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
