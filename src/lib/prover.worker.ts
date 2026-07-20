import * as Comlink from 'comlink';

// Mock implementation of random hex for fallback
const HEX_CHARS = '0123456789abcdef';
function randomHex(len: number) {
  let s = '';
  for (let i = 0; i < len; i++) s += HEX_CHARS[Math.floor(Math.random() * 16)];
  return s;
}

export const ProverWorkerAPI = {
  async generateProof(input: any) {
    try {
      // Import snarkjs dynamically
      // In a real environment, this assumes snarkjs is available or we bundle it
      const snarkjs = await import('snarkjs');

      // These paths would typically be served from the public/ directory
      const wasmPath = '/circuit.wasm';
      const zkeyPath = '/circuit_final.zkey';

      // Check if files exist, otherwise fallback to simulated
      const res = await fetch(wasmPath, { method: 'HEAD' });
      if (!res.ok) {
        throw new Error('WASM circuit not found, falling back to simulated proof');
      }

      const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        input,
        wasmPath,
        zkeyPath
      );

      // Convert proof to hex/bytes for contract submission
      const proofHex = Buffer.from(JSON.stringify(proof)).toString('hex');
      
      return {
        proofHex: proofHex.substring(0, 96), // truncate for UI purposes if needed
        publicSignals,
        simulated: false
      };
    } catch (err) {
      console.warn('Proof generation fallback:', err);
      // Fallback to simulated delay if WASM not present
      await new Promise(r => setTimeout(r, 2000));
      return {
        proofHex: randomHex(96),
        publicSignals: [input.amount_in, input.amount_out],
        simulated: true
      };
    }
  }
};

Comlink.expose(ProverWorkerAPI);
