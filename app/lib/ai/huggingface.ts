// app/lib/ai/huggingface.ts
const HF_URL = 'https://api-inference.huggingface.co/models/google/vit-base-patch16-224';

function withTimeout<T>(p: Promise<T>, ms = 30_000): Promise<T> {
 return new Promise((resolve, reject) => {
  const t = setTimeout(() => reject(new Error('HF-timeout')), ms);
  p.then(
   (v) => {
    clearTimeout(t);
    resolve(v);
   },
   (e) => {
    clearTimeout(t);
    reject(e);
   }
  );
 });
}

export async function hfClassifyImageBase64(
 base64: string
): Promise<Array<{ label: string; score: number }>> {
 const apiKey = process.env.HUGGING_FACE_API_KEY;
 if (!apiKey) {
  throw new Error('Saknar HUGGING_FACE_API_KEY');
 }

 const res = await withTimeout(
  fetch(HF_URL, {
   method: 'POST',
   headers: { Authorization: `Bearer ${apiKey}` },
   body: Buffer.from(base64, 'base64'),
  })
 );

 if (!res.ok) {
  throw new Error(`HuggingFace fel: ${res.status}`);
 }

 const json = await res.json();

 // HF kan svara i olika format; normalisera
 const arr = Array.isArray(json) ? json : json?.[0] ? [json[0]] : [];
 return (arr as any[]).map((x) => ({ label: x.label || x.label_name || 'unknown', score: x.score || 0 }));
}

