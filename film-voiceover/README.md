# Family Dentistry film: voiceover kit

Generates the narration for the Family Dentistry film, one clip per scene, in the voice of ElevenLabs "Sarah" (American, female, voice `EXAVITQu4vr4xnSDxMaL`, model `eleven_multilingual_v2`, stability 0.5, style 0.3).

```bash
cd film-voiceover
SCRIPT=fd ELEVENLABS_API_KEY=... node scripts/voiceover.mjs familydentistry
```

Needs Node 22 and ffmpeg. Writes `public/voiceover/familydentistry/*.mp3` and `manifest.json`. Commit only those files; never commit or print the key.
