// AI hint inside an exercise: counts as a hint like the ladder does, never shows the reference solution.
import { useState } from 'react';
import { useAiReady } from '../../ai/config';
import { hintMessages, hintLevel } from '../../ai/prompts';
import { useAiRequest } from '../../ai/useAiRequest';
import { AiAnswer, AiPrivacyNote, AiStatus } from './AiAnswer';

export interface AiHintProps {
  prompt: string;
  lang?: string;
  code?: string;
  reference?: string[];
  /** Hints already used (ladder + AI): selects how concrete the AI hint is. */
  used: number;
  shownHints: string[];
  /** The hint limit is reached. */
  blocked: boolean;
  onUsed: () => void;
}

export function AiHint({ prompt, lang, code, reference, used, shownHints, blocked, onUsed }: AiHintProps) {
  const cfg = useAiReady();
  const { state, run, cancel } = useAiRequest();
  const [answers, setAnswers] = useState<{ text: string; filtered: boolean; model: string; ms: number }[]>([]);
  if (!cfg) return null;
  const ask = async () => {
    const r = await run(cfg, hintMessages({ prompt, lang, code, used, shownHints: [...shownHints, ...answers.map((a) => a.text)] }), {
      reference, hint: 'сравните своё решение с условием и примерами проверок — какой из них пока не проходит и почему?',
    });
    if (r) {
      setAnswers((a) => [...a, r]);
      onUsed();
    }
  };
  return (
    <div className="ai-box stack tight" data-testid="ai-hint">
      {answers.map((a, i) => (
        <div key={i} className="hint stack tight">
          <strong className="small">AI-подсказка {i + 1}</strong>
          <AiAnswer text={a.text} filtered={a.filtered} model={a.model} ms={a.ms} />
        </div>
      ))}
      <AiStatus state={state} onCancel={cancel} />
      {!blocked && (
        <div className="row tight">
          <button className="btn sm ghost" onClick={() => void ask()} disabled={state.status === 'loading'} data-testid="ai-hint-btn">
            🤖 {answers.length ? 'Ещё AI-подсказка' : 'AI-подсказка'} <span className="tiny muted">(уровень {hintLevel(used)}/3, снижает вес решения)</span>
          </button>
          <AiPrivacyNote cfg={cfg} />
        </div>
      )}
    </div>
  );
}
