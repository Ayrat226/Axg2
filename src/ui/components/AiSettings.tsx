// Settings tab for the optional AI tutor (bring your own key). The key lives only in localStorage[learnlab:ai].
import { useEffect, useRef, useState } from 'react';
import { AiError, listModels, testConnection } from '../../ai/client';
import { clearAiConfig, hostOf, isConfigured, saveAiConfig, useAiStore, validateBaseUrl } from '../../ai/config';
import { Section, Setting, SwitchSetting } from './SettingControls';

type Probe = { status: 'idle' } | { status: 'busy'; what: 'models' | 'test' } | { status: 'ok'; text: string } | { status: 'error'; text: string };

export function AiSettings() {
  const { config: c, feedback } = useAiStore();
  const [models, setModels] = useState<string[]>([]);
  const [probe, setProbe] = useState<Probe>({ status: 'idle' });
  const [showKey, setShowKey] = useState(false);
  const ctl = useRef<AbortController | null>(null);
  useEffect(() => () => ctl.current?.abort(), []);

  const urlError = c.baseUrl ? validateBaseUrl(c.baseUrl) : null;
  const ready = isConfigured(c);
  const canProbe = !validateBaseUrl(c.baseUrl) && probe.status !== 'busy';

  const fail = (e: unknown) => setProbe({ status: 'error', text: e instanceof AiError ? e.message : 'Не удалось выполнить запрос.' });
  const begin = (what: 'models' | 'test') => { ctl.current?.abort(); ctl.current = new AbortController(); setProbe({ status: 'busy', what }); return ctl.current.signal; };

  const loadModels = async () => {
    const signal = begin('models');
    try {
      const ids = await listModels(c, { signal });
      setModels(ids);
      setProbe({ status: 'ok', text: `Найдено моделей: ${ids.length}. Выберите одну из списка.` });
    } catch (e) { fail(e); }
  };
  const test = async () => {
    const signal = begin('test');
    try {
      const r = await testConnection(c, signal);
      setProbe({ status: 'ok', text: `Соединение работает: модель ${r.model}, задержка ${(r.ms / 1000).toFixed(1)} с.` });
    } catch (e) { fail(e); }
  };

  return (
    <>
      <Section title="AI-помощник" sub="необязательно, выключен по умолчанию">
        <div className="card flat stack tight" role="note" data-testid="ai-privacy">
          <strong className="small">🔒 Конфиденциальность</strong>
          <span className="small">Запросы уходят <strong>напрямую с вашего устройства</strong> к выбранному провайдеру — через серверы LearnLab они не проходят. Отправляются код, текст ошибки, условие задания и ваш вопрос. Ключ хранится только в этом браузере (отдельно от прогресса) и не попадает в файлы экспорта.</span>
          <span className="small muted">Как это встроено в обучение: AI не выдаёт готовые решения активных заданий (такие фрагменты кода скрываются), его подсказка считается подсказкой и снижает вес решения, а в диагностике и отложенных проверках AI недоступен.</span>
        </div>
        <SwitchSetting
          label="Включить AI-помощника"
          hint="Добавляет кнопки «Объясни иначе», «Спросить AI, почему так» и «AI-подсказка». Пока выключено — никаких запросов не отправляется."
          checked={c.enabled} onChange={(v) => saveAiConfig({ enabled: v })}
        />
        <Setting label="Адрес API" hint="Любой OpenAI-совместимый сервис, например https://example.com/v1 (для локальных моделей допустим http://localhost).">
          <input
            type="url" className="mono" style={{ width: 320, maxWidth: '100%' }} value={c.baseUrl} placeholder="https://example.com/v1" spellCheck={false} autoComplete="off"
            aria-label="Адрес API" aria-invalid={!!urlError} onChange={(e) => { saveAiConfig({ baseUrl: e.target.value }); setModels([]); }}
          />
          {urlError && <div className="tiny" style={{ color: 'var(--err)' }} role="alert">⚠ {urlError}</div>}
        </Setting>
        <Setting label="API-ключ" hint="Хранится только на этом устройстве.">
          <div className="row tight">
            <input
              type={showKey ? 'text' : 'password'} className="mono" style={{ width: 260, maxWidth: '100%' }} value={c.apiKey} spellCheck={false} autoComplete="off" placeholder="sk-…"
              aria-label="API-ключ" onChange={(e) => saveAiConfig({ apiKey: e.target.value })}
            />
            <button className="btn sm ghost" onClick={() => setShowKey((v) => !v)} aria-pressed={showKey}>{showKey ? 'Скрыть' : 'Показать'}</button>
          </div>
        </Setting>
        <Setting label="Модель" hint="Список подгружается из /models; название можно ввести вручную.">
          <div className="stack tight" style={{ width: 320, maxWidth: '100%' }}>
            {models.length > 0 && (
              <select aria-label="Модель из списка" value={models.includes(c.model) ? c.model : ''} onChange={(e) => e.target.value && saveAiConfig({ model: e.target.value })}>
                <option value="">— выберите модель —</option>
                {models.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            )}
            <input type="text" className="mono" value={c.model} placeholder="название модели" spellCheck={false} autoComplete="off" aria-label="Название модели" onChange={(e) => saveAiConfig({ model: e.target.value })} />
            <div className="row tight">
              <button className="btn sm" onClick={() => void loadModels()} disabled={!canProbe} data-testid="ai-load-models">Загрузить список моделей</button>
              <button className="btn sm primary" onClick={() => void test()} disabled={!canProbe || !c.model.trim()} data-testid="ai-test">Проверить соединение</button>
            </div>
          </div>
        </Setting>
        <div aria-live="polite" data-testid="ai-probe">
          {probe.status === 'busy' && <div className="row tight small" role="status"><span className="pulse" aria-hidden="true">⏳</span>{probe.what === 'models' ? 'Загружаю список моделей…' : 'Проверяю соединение…'} <button className="btn sm ghost" onClick={() => ctl.current?.abort()}>Отмена</button></div>}
          {probe.status === 'ok' && <div className="card feedback ok small" role="status">✓ {probe.text}</div>}
          {probe.status === 'error' && <div className="card feedback bad small" role="alert">⚠ {probe.text}</div>}
        </div>
        <div className="row spread" style={{ paddingTop: 10 }}>
          <span className={`chip ${ready ? 'ok' : ''}`} data-testid="ai-status">
            {ready ? `✓ Готов: ${hostOf(c.baseUrl)} · ${c.model}` : c.enabled ? 'Включён, но не настроен: нужны адрес, ключ и модель' : 'Выключен'}
          </span>
          <div className="row tight">
            <span className="tiny muted" data-testid="ai-feedback-stats">Оценки ответов: 👍 {feedback.up} · 👎 {feedback.down}</span>
            <button className="btn sm danger" onClick={() => { clearAiConfig(); setModels([]); setProbe({ status: 'idle' }); }} data-testid="ai-clear">Удалить ключ и настройки</button>
          </div>
        </div>
      </Section>
    </>
  );
}
