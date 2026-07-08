declare module 'kuromoji' {
  export interface IpadicFeatures {
    surface_form: string
    reading?: string
    pronunciation?: string
    [key: string]: unknown
  }
  export interface Tokenizer {
    tokenize(text: string): IpadicFeatures[]
  }
  export interface Builder {
    build(callback: (err: Error | null, tokenizer: Tokenizer) => void): void
  }
  export function builder(option: { dicPath: string }): Builder

  const kuromoji: { builder: typeof builder }
  export default kuromoji
}
