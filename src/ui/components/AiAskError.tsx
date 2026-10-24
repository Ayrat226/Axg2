// "Ask AI why": sends the error, the learner's code, the exercise prompt and the rule-based explanation.
import { useAiReady } from '../../ai/config';
import { errorMessages } from '../../ai/prompts';
import { useAiRequest } from '../../ai/useAiRequest';
import { AiAnswer, AiPrivacyNote, AiStatus } from './AiAnswer';

export interface AiErrorContext { prompt?: string; reference?: string; lang?: string; hint?: string }

export function AiAskError({ errorType, errorMessage, line, code, ruleBased, ctx }: {
  errorType: string; errorMessage: string; line?: number | null; code: string; ruleBased: string; ctx?: AiErrorContext;
}) {
  const cfg = useAiReady();
  const { state, run, cancel } = useAiRequest();
  if (!cfg) return null;
  const ask = () => run(
    cfg,
    errorMessages({ prompt: ctx?.prompt ?? '', lang: ctx?.lang, code, errorType, errorMessage, line, ruleBased }),
    { reference: ctx?.reference ? [ctx.reference] : undefined, hint: ctx?.hint },
  );
  return (
    <div className="ai-box stack tight" data-testid="ai-ask-error">
      <div className="row tight">
        <button className="btn sm" onClick={() => void ask()} disabled={state.status === 'loading'} data-testid="ai-ask-btn">🤖 Спросить AI, почему так</button>
        <AiPrivacyNote cfg={cfg} />
      </div>
      <AiStatus state={state} onCancel={cancel} />
      {state.status === 'done' && <AiAnswer text={state.text} filtered={state.filtered} model={state.model} ms={state.ms} />}
    </div>
  );
}
