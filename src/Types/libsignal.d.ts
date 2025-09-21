// Type definitions for libsignal
declare module 'libsignal' {
  export interface KeyPair {
    pubKey: ArrayBuffer;
    privKey: ArrayBuffer;
  }

  export const curve: {
    generateKeyPair(): KeyPair;
    calculateSignature(privateKey: any, message: Uint8Array): Uint8Array;
  };
}
