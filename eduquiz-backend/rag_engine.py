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

from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api.formatters import TextFormatter
from sentence_transformers import SentenceTransformer
import faiss


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
        """
        Fetch transcript with full compatibility:
          - youtube-transcript-api v2.x  (instance-based, api.fetch())
          - youtube-transcript-api v0.x  (class-method, list_transcripts())
        """
        # ── Attempt 1: v2.x instance API ─────────────────────────────────────
        try:
            ytt_api  = YouTubeTranscriptApi()
            fetched  = ytt_api.fetch(video_id)
            snippets = list(fetched)
            text     = " ".join(
                (s.text if hasattr(s, "text") else s.get("text", ""))
                for s in snippets
            )
            if text.strip():
                metadata = {
                    "video_id":     video_id,
                    "language":     getattr(fetched, "language", "en"),
                    "is_generated": getattr(fetched, "is_generated", True),
                    "title":        f"Video {video_id}",
                }
                return text, metadata
        except Exception:
            pass  # fall through to v0.x path

        # ── Attempt 2: v0.x class-method API ─────────────────────────────────
        try:
            transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
            try:
                transcript = transcript_list.find_manually_created_transcript(["en"])
            except Exception:
                try:
                    transcript = transcript_list.find_generated_transcript(["en"])
                except Exception:
                    transcript = next(iter(transcript_list))

            raw       = transcript.fetch()
            formatter = TextFormatter()
            text      = formatter.format_transcript(raw)
            metadata  = {
                "video_id":     video_id,
                "language":     transcript.language,
                "is_generated": transcript.is_generated,
                "title":        f"Video {video_id}",
            }
            return text, metadata
        except Exception:
            pass

        # ── Attempt 3: simplest v0.x fallback ────────────────────────────────
        try:
            raw_list  = YouTubeTranscriptApi.get_transcript(video_id)
            text      = " ".join(item.get("text", "") for item in raw_list)
            metadata  = {
                "video_id":     video_id,
                "language":     "en",
                "is_generated": True,
                "title":        f"Video {video_id}",
            }
            return text, metadata
        except Exception as e:
            raise RuntimeError(
                f"Could not fetch transcript for video '{video_id}'.\n"
                f"Make sure the video has captions enabled.\n\nDetails: {e}"
            )

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
