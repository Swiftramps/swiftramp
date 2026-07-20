import * as Comlink from 'comlink';

let worker: Worker | null = null;
let proverApi: any = null;

export async function generateProof(input: any) {
  if (typeof window === 'undefined') {
    throw new Error('Prover can only run in the browser');
  }

  if (!worker) {
    worker = new Worker(new URL('./prover.worker.ts', import.meta.url), { type: 'module' });
    proverApi = Comlink.wrap(worker);
  }

  return await proverApi.generateProof(input);
}
