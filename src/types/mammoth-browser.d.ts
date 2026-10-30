declare module 'mammoth/mammoth.browser' {
  interface ExtractInput {
    arrayBuffer: ArrayBuffer
  }
  interface ExtractResult {
    value: string
    messages: unknown[]
  }
  export function extractRawText(input: ExtractInput): Promise<ExtractResult>
  const mammoth: { extractRawText: typeof extractRawText }
  export default mammoth
}
