/**
 * Ambient declaration for `snarkjs`, which ships no TypeScript types.
 *
 * Only the surface the prover worker actually uses is declared; everything else
 * stays `any` rather than pretending to a precision the upstream package does
 * not provide.
 */
declare module 'snarkjs' {
  export interface Groth16Proof {
    pi_a: string[]
    pi_b: string[][]
    pi_c: string[]
    protocol: string
    curve?: string
  }

  export interface FullProveResult {
    proof: Groth16Proof
    publicSignals: string[]
  }

  export const groth16: {
    fullProve(
      input: Record<string, unknown>,
      wasmPath: string,
      zkeyPath: string,
    ): Promise<FullProveResult>
    verify(
      verificationKey: unknown,
      publicSignals: string[],
      proof: Groth16Proof,
    ): Promise<boolean>
  }
}
