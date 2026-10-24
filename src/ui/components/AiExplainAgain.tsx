// Lesson helper: "explain differently" with the chosen style. Only rendered when the AI tutor is enabled and configured.
import { useAiReady } from '../../ai/config';
import { EXPLAIN_STYLES, explainAgainMessages, type ExplainStyle } from '../../ai/prompts';
import { useAiRequest } from '../../ai/useAiRequest';
import { AiAnswer, AiPrivacyNote, AiStatus } from './AiAnswer';

export function AiExplainAgain({ skillTitle, lesson, exampleCode, lang }: { skillTitle: string; lesson: string; exampleCode: string; lang: string }) {
  const cfg = useAiReady();
  const { state, run, cancel } = useAiRequest();
  if (!cfg) return null;
  const ask = (style: ExplainStyle) => run(cfg, explainAgainMessages({ style, skillTitle, lesson, exampleCode, lang }), { maxLines: 15 });
  return (
    <div className="ai-box stack tight" data-testid="ai-explain">
      <div className="row tight">
        <strong className="small">🤖 Объясни иначе (AI)</strong>
        <AiPrivacyNote cfg={cfg} />
      </div>
      <div className="row tight" role="group" aria-label="Способ объяснения">
        {EXPLAIN_STYLES.map((s) => (
          <button key={s.id} className="btn sm" disabled={state.status === 'loading'} onClick={() => void ask(s.id)} data-testid={`ai-style-${s.id}`}>{s.label}</button>
        ))}
      </div>
      <AiStatus state={state} onCancel={cancel} />
      {state.status === 'done' && <AiAnswer text={state.text} filtered={state.filtered} model={state.model} ms={state.ms} />}
    </div>
  );
}
