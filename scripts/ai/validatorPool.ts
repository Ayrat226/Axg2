import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { createInterface } from 'node:readline';
import type { Exercise, Skill } from '../../src/core/types';

interface Slot { proc: ChildProcessWithoutNullStreams; ready: Promise<void>; busy: boolean; pending?: { id: number; resolve: (p: string[]) => void } }

export class ValidatorPool {
  private slots: Slot[] = [];
  private queue: (() => void)[] = [];
  private seq = 0;
  constructor(private size = 3, private timeoutMs = 40_000) {
    for (let i = 0; i < size; i++) this.slots.push(this.spawn());
  }
  private spawn(): Slot {
    const proc = spawn('npx', ['tsx', 'scripts/ai/validator-server.ts'], { stdio: ['pipe', 'pipe', 'pipe'] });
    let markReady!: () => void;
    const slot: Slot = { proc, busy: false, ready: new Promise((r) => (markReady = r)) };
    createInterface({ input: proc.stdout }).on('line', (line) => {
      let msg: { ready?: boolean; id?: number; problems?: string[] };
      try { msg = JSON.parse(line); } catch { return; }
      if (msg.ready) return markReady();
      if (slot.pending && msg.id === slot.pending.id) { const p = slot.pending; slot.pending = undefined; p.resolve(msg.problems ?? []); }
    });
    proc.stderr.on('data', () => {});
    return slot;
  }
  async validate(exercise: Exercise, skill?: Skill): Promise<string[]> {
    let slot = this.slots.find((s) => !s.busy);
    while (!slot) { await new Promise<void>((r) => this.queue.push(r)); slot = this.slots.find((s) => !s.busy); }
    slot.busy = true;
    await slot.ready;
    const id = ++this.seq;
    try {
      return await new Promise<string[]>((resolve) => {
        const timer = setTimeout(() => {
          // Hung (infinite loop) or crashed: replace the process.
          slot!.proc.kill('SIGKILL');
          const idx = this.slots.indexOf(slot!);
          const fresh = this.spawn();
          this.slots[idx] = fresh;
          slot = fresh;
          resolve([`validation timed out after ${this.timeoutMs / 1000}s (infinite loop or too slow)`]);
        }, this.timeoutMs);
        slot!.pending = { id, resolve: (p) => { clearTimeout(timer); resolve(p); } };
        slot!.proc.stdin.write(JSON.stringify({ id, exercise, skill }) + '\n');
      });
    } finally {
      slot.busy = false;
      this.queue.shift()?.();
    }
  }
  close() { for (const s of this.slots) s.proc.kill(); }
}
