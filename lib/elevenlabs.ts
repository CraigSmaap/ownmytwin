const API_KEY = process.env.ELEVENLABS_API_KEY;
const BASE    = "https://api.elevenlabs.io/v1";

export const elevenLabsEnabled = !!API_KEY;

export async function createVoiceClone(name: string, audioUrls: string[]): Promise<string> {
  if (!API_KEY) throw new Error("ELEVENLABS_API_KEY not set");

  const form = new FormData();
  form.append("name", name);
  form.append("description", `AI Twin voice clone for ${name}`);

  for (const url of audioUrls) {
    const res  = await fetch(url);
    const blob = await res.blob();
    form.append("files", blob, "sample.webm");
  }

  const res = await fetch(`${BASE}/voices/add`, {
    method:  "POST",
    headers: { "xi-api-key": API_KEY },
    body:    form,
  });

  if (!res.ok) throw new Error(`ElevenLabs clone failed: ${await res.text()}`);
  const { voice_id } = await res.json();
  return voice_id as string;
}

export async function textToSpeech(voiceId: string, text: string): Promise<ArrayBuffer> {
  if (!API_KEY) throw new Error("ELEVENLABS_API_KEY not set");

  const res = await fetch(`${BASE}/text-to-speech/${voiceId}`, {
    method:  "POST",
    headers: { "xi-api-key": API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      model_id: "eleven_multilingual_v2",
      voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    }),
  });

  if (!res.ok) throw new Error(`ElevenLabs TTS failed: ${await res.text()}`);
  return res.arrayBuffer();
}
