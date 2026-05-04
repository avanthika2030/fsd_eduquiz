"""
rag_engine.py
─────────────
Handles:
  1. YouTube transcript extraction — compatible with youtube-transcript-api v0.x AND v2.x
  2. Text chunking with sliding window
  3. Embeddings via SentenceTransformers (local, free)
  4. In-memory FAISS vector store
  5. Semantic retrieval for RAG
"""

import re
from typing import List, Tuple, Dict
import os
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api.formatters import TextFormatter
from sentence_transformers import SentenceTransformer
import faiss
import logging
import warnings
logging.getLogger("transformers").setLevel(logging.ERROR)
warnings.filterwarnings("ignore", module="transformers")


class RAGEngine:
    """Retrieval-Augmented Generation engine for YouTube transcripts."""

    EMBED_MODEL   = "all-MiniLM-L6-v2"   # 384-dim, fast, local
    CHUNK_SIZE    = 400   # words per chunk
    CHUNK_OVERLAP = 80    # word overlap between consecutive chunks

    def __init__(self, api_key: str = ""):
        # api_key kept for interface compatibility; embeddings are local
        self._embedder: SentenceTransformer = None
        self._index: faiss.IndexFlatIP      = None
        self._chunks: List[str]             = []
        self._video_title: str              = ""

    # ── Public API ────────────────────────────────────────────────────────────

    def process_video(self, url: str) -> Tuple[List[str], str, Dict]:
        """URL → transcript → chunks → FAISS index. Returns (chunks, title, metadata)."""
        video_id = _extract_video_id(url)
        if not video_id:
            raise ValueError("Could not extract a valid video ID from the URL.")

        transcript_text, metadata = self._fetch_transcript(video_id)
        chunks = self._chunk_text(transcript_text)
        self._chunks = chunks
        self._build_index(chunks)
        self._video_title = metadata.get("title", f"Video {video_id}")
        return chunks, self._video_title, metadata

    def retrieve_context(self, query: str, k: int = 4) -> List[str]:
        """Return top-k most relevant transcript chunks for a query."""
        if self._index is None or not self._chunks:
            return []
        embedder = self._get_embedder()
        q_vec = embedder.encode([query], normalize_embeddings=True).astype("float32")
        k = min(k, len(self._chunks))
        _, indices = self._index.search(q_vec, k)
        return [self._chunks[i] for i in indices[0] if i < len(self._chunks)]

    def get_full_context_summary(self, max_chars: int = 6000) -> str:
        """Return a representative sampled excerpt of the transcript."""
        if not self._chunks:
            return ""
        step    = max(1, len(self._chunks) // 15)
        sampled = self._chunks[::step]
        return "\n\n".join(sampled)[:max_chars]

    # ── Private helpers ───────────────────────────────────────────────────────

    def _fetch_transcript(self, video_id: str) -> Tuple[str, Dict]:
        errors = []
        ytt_api = YouTubeTranscriptApi()

        # Attempt 1: fetch() English
        try:
            fetched = ytt_api.fetch(video_id, languages=["en"])
            text = " ".join(s.text for s in fetched)
            if text.strip():
                return text, {
                    "video_id": video_id,
                    "language": getattr(fetched, "language_code", "en"),
                    "is_generated": getattr(fetched, "is_generated", True),
                    "title": f"Video {video_id}",
                }
            errors.append("Attempt 1: empty text")
        except Exception as e:
            errors.append(f"Attempt 1 (fetch en): {type(e).__name__}: {e}")

        # Attempt 2: fetch() any language
        try:
            transcript_list = ytt_api.list(video_id)
            transcript = transcript_list.find_transcript(["en"])
            fetched = transcript.fetch()
            text = " ".join(s.text for s in fetched)
            if text.strip():
                return text, {
                    "video_id": video_id,
                    "language": getattr(transcript, "language_code", "en"),
                    "is_generated": getattr(transcript, "is_generated", True),
                    "title": f"Video {video_id}",
                }
            errors.append("Attempt 2: empty text")
        except Exception as e:
            errors.append(f"Attempt 2 (list en): {type(e).__name__}: {e}")

        # Attempt 3: any available transcript
        try:
            transcript_list = ytt_api.list(video_id)
            transcript = next(iter(transcript_list))
            fetched = transcript.fetch()
            text = " ".join(s.text for s in fetched)
            if text.strip():
                return text, {
                    "video_id": video_id,
                    "language": getattr(transcript, "language_code", "unknown"),
                    "is_generated": getattr(transcript, "is_generated", True),
                    "title": f"Video {video_id}",
                }
            errors.append("Attempt 3: empty text")
        except Exception as e:
            errors.append(f"Attempt 3 (any lang): {type(e).__name__}: {e}")


        # ── Attempt 4: Whisper fallback (NOW WORKS) ───────
        try:
            import shutil
            import yt_dlp
            import whisper

            ffmpeg_path = shutil.which("ffmpeg")
            if not ffmpeg_path:
                raise RuntimeError(
                    "Whisper fallback requires `ffmpeg`, but it was not found on PATH."
                )

            audio_base = f"{video_id}"
            audio_file = f"{audio_base}.mp3"

            # Optional: help avoid YouTube bot checks by using a cookie file exported locally.
            # Set either of these env vars:
            #   - YTDLP_COOKIEFILE="C:\\path\\to\\cookies.txt"
            #   - YTDLP_COOKIES="C:\\path\\to\\cookies.txt"
            cookiefile = os.getenv("YTDLP_COOKIEFILE") or os.getenv("YTDLP_COOKIES")
            if not cookiefile:
                # Convenience fallback: allow dropping a `cookies.txt` next to `app.py`
                # so the fallback works without env configuration.
                candidates = [
                    os.path.join(os.getcwd(), "cookies.txt"),
                    os.path.join(os.path.dirname(__file__), "cookies.txt"),
                ]
                for c in candidates:
                    if os.path.exists(c):
                        cookiefile = c
                        break

            # Base yt-dlp options. We do format selection in a small retry loop below
            # because some YouTube challenges may hide certain "audio only" formats.
            ydl_opts = {
                "outtmpl": audio_base,
                "quiet": True,
                "noplaylist": True,
                "retries": 10,
                "fragment_retries": 10,
                "extractor_retries": 10,
                "socket_timeout": 30,
                # Enable EJS challenge helpers when needed (fixes cases where some formats
                # show up as "images only" due to signature/decryption problems).
                # If your yt-dlp already has these components, this is harmless.
                "remote_components": ["ejs:github"],
                # Hint: yt-dlp will use whatever JS runtime is available; deno is often pre-enabled,
                # but node can improve success rate. Add both; yt-dlp will ignore missing runtimes.
                "jsruntimes": ["node", "deno"],
                # Ensure we end up with a predictable `.mp3` file that Whisper can decode.
                "postprocessors": [
                    {
                        "key": "FFmpegExtractAudio",
                        "preferredcodec": "mp3",
                        "preferredquality": "192",
                    }
                ],
            }

            if cookiefile:
                ydl_opts["cookiefile"] = cookiefile

            try:
                youtube_url = f"https://www.youtube.com/watch?v={video_id}"
                # Try audio-only first; if not available (due to challenge/decrypt issues),
                # fall back to downloading the best combined stream and extracting audio.
                download_error: Exception | None = None
                for format_spec in ["bestaudio/best", "best"]:
                    ydl_opts["format"] = format_spec
                    # Clean up between attempts (prevents stale partial files).
                    if os.path.exists(audio_file):
                        try:
                            os.remove(audio_file)
                        except Exception:
                            pass
                    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                        try:
                            ydl.download([youtube_url])
                        except Exception as e:
                            download_error = e
                            continue
                    # If download succeeded, the postprocessor should create the mp3.
                    if os.path.exists(audio_file):
                        break

                if not os.path.exists(audio_file):
                    raise RuntimeError(
                        f"yt-dlp finished without creating audio file '{audio_file}'. "
                        f"Last error: {download_error}"
                    )

                model = whisper.load_model("base")
                result = model.transcribe(audio_file)

                text = result.get("text", "") if isinstance(result, dict) else ""

                return text, {
                    "video_id": video_id,
                    "language": "auto",
                    "is_generated": True,
                    "title": f"Video {video_id} (Whisper)",
                }
            finally:
                if os.path.exists(audio_file):
                    os.remove(audio_file)

        except ModuleNotFoundError as e:
            raise RuntimeError(
                "Whisper fallback prerequisites are missing. "
                "Install `openai-whisper` and `yt-dlp` (and `ffmpeg` for audio decoding). "
                f"Missing module: {e.name}"
            ) from e
        except Exception as e:
            msg = str(e).lower()

            hint_parts = []
            if "ffmpeg" in msg and "path" in msg:
                hint_parts.append("Install `ffmpeg` and make sure `ffmpeg` is on your PATH.")
            if "429" in msg or "too many requests" in msg:
                hint_parts.append(
                    "YouTube is rate-limiting or blocking yt-dlp. Wait a bit and retry, or set `YTDLP_COOKIEFILE` "
                    "to a cookies.txt export to bypass bot checks."
                )
            if "sign in to confirm" in msg or "not a bot" in msg:
                hint_parts.append(
                    "yt-dlp is being blocked by YouTube. Export cookies to a file and set `YTDLP_COOKIEFILE` "
                    "(or `YTDLP_COOKIES`) so yt-dlp can authenticate."
                )

            hint = ("\nHint: " + " ".join(hint_parts)) if hint_parts else ""
            raise RuntimeError(
                f"All transcript methods failed for '{video_id}'.\nDetails: {e}{hint}"
            ) from e
        
    def _chunk_text(self, text: str) -> List[str]:
        words  = text.split()
        chunks = []
        start  = 0
        while start < len(words):
            chunk = " ".join(words[start: start + self.CHUNK_SIZE])
            if chunk.strip():
                chunks.append(chunk.strip())
            start += self.CHUNK_SIZE - self.CHUNK_OVERLAP
        return chunks

    def _get_embedder(self) -> SentenceTransformer:
        if self._embedder is None:
            self._embedder = SentenceTransformer(self.EMBED_MODEL)
        return self._embedder

    def _build_index(self, chunks: List[str]):
        embedder   = self._get_embedder()
        embeddings = embedder.encode(
            chunks, normalize_embeddings=True, show_progress_bar=False
        ).astype("float32")
        dim   = embeddings.shape[1]
        index = faiss.IndexFlatIP(dim)
        index.add(embeddings)
        self._index = index


# ── Standalone helper ─────────────────────────────────────────────────────────

def _extract_video_id(url: str):
    patterns = [
        r"(?:v=)([A-Za-z0-9_-]{11})",
        r"(?:youtu\.be/)([A-Za-z0-9_-]{11})",
        r"(?:embed/)([A-Za-z0-9_-]{11})",
        r"(?:shorts/)([A-Za-z0-9_-]{11})",
    ]
    for p in patterns:
        m = re.search(p, url)
        if m:
            return m.group(1)
    return None
