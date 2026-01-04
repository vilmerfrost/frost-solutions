import { renderToStream } from '@react-pdf/renderer'
import { QuotePDF } from './quote-template'

export async function generateQuotePDF(quote: any, items: any[]): Promise<Buffer> {
 const stream = await renderToStream(<QuotePDF quote={quote} items={items} />)
 const chunks: Uint8Array[] = []
 for await (const chunk of stream) {
  chunks.push(Buffer.from(chunk))
 }
 return Buffer.concat(chunks)
}

