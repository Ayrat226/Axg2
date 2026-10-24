import { ROUTES } from '../../content';
import { RouteCard } from './Home';

export function RoutesScreen() {
  return (
    <div className="page">
      <div className="stack tight">
        <h1>Маршруты</h1>
        <p className="muted" style={{ margin: 0 }}>Каждый маршрут — граф навыков с зависимостями. Перед стартом можно пройти умную диагностику: она адаптивно подбирает вопросы и показывает, какие темы можно пропустить.</p>
      </div>
      <div className="grid cols-2">{ROUTES.map((r) => <RouteCard key={r.id} id={r.id} />)}</div>
    </div>
  );
}
