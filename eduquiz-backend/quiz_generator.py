"""
quiz_generator.py
─────────────────
Uses RAG-retrieved context + Groq (Llama 3.3 70B) to generate
MCQ questions distributed across Bloom's Taxonomy levels.
"""

import json
import re
import random
from typing import List, Dict

from groq import Groq
from rag_engine import RAGEngine


BLOOM_DEFINITIONS = {
    "Remember": {
        "description": "Recall facts and basic concepts from the video.",
        "verbs": "define, list, recall, identify, name, state, match",
        "example": "What is the definition of X as described in the video?"
    },
    "Understand": {
        "description": "Explain ideas or concepts in your own words.",
        "verbs": "explain, summarize, describe, classify, interpret, paraphrase",
        "example": "Which best explains why X works the way it does?"
    },
    "Apply": {
        "description": "Use information in a new situation or context.",
        "verbs": "use, demonstrate, solve, apply, implement, execute",
        "example": "How would you apply the concept of X to solve Y?"
    },
    "Analyze": {
        "description": "Draw connections, break down components, find patterns.",
        "verbs": "compare, contrast, differentiate, examine, break down, infer",
        "example": "What is the key difference between X and Y as discussed?"
    },
    "Evaluate": {
        "description": "Justify decisions, judge quality, critique arguments.",
        "verbs": "judge, justify, critique, recommend, assess, prioritize",
        "example": "Which approach is most effective according to the video and why?"
    },
    "Create": {
        "description": "Produce a new work or combine ideas in a novel way.",
        "verbs": "design, formulate, construct, propose, devise, synthesize",
        "example": "Which combination of concepts from the video would best solve X?"
    },
}

GROQ_MODELS = {
    "Llama 3.3 70B (Recommended)": "llama-3.3-70b-versatile",
    "Llama 3.1 8B (Fastest)":      "llama-3.1-8b-instant",
    "Llama 3 70B":                  "llama3-70b-8192",
    "Mixtral 8x7B":                 "mixtral-8x7b-32768",
    "Gemma2 9B":                    "gemma2-9b-it",
}


class QuizGenerator:
    """Generates MCQ quizzes using RAG context and Groq Llama."""

    def __init__(self, api_key: str, model: str = "llama-3.3-70b-versatile"):
        self.client = Groq(api_key=api_key)
        self.model  = model

    def generate_quiz(
        self,
        rag_engine: RAGEngine,
        num_questions: int = 8,
        bloom_levels: List[str] = None,
        difficulty: str = "Medium"
    ) -> List[Dict]:
        bloom_levels = bloom_levels or ["Remember", "Understand", "Apply", "Analyze"]
        distribution = self._distribute_questions(num_questions, bloom_levels)
        all_questions = []

        for bloom_level, count in distribution.items():
            if count == 0:
                continue
            bloom_query    = BLOOM_DEFINITIONS[bloom_level]["description"]
            context_chunks = rag_engine.retrieve_context(bloom_query, k=5)
            overview       = rag_engine.get_full_context_summary(max_chars=3000)
            context_text   = "\n\n---\n\n".join(context_chunks) if context_chunks else overview
            questions = self._generate_questions_for_level(
                context_text=context_text,
                bloom_level=bloom_level,
                count=count,
                difficulty=difficulty
            )
            all_questions.extend(questions)

        random.shuffle(all_questions)
        return all_questions[:num_questions]

    def _distribute_questions(self, total: int, levels: List[str]) -> Dict[str, int]:
        base  = total // len(levels)
        extra = total % len(levels)
        dist  = {level: base for level in levels}
        for i, level in enumerate(levels):
            if i < extra:
                dist[level] += 1
        return dist

    def _generate_questions_for_level(
        self, context_text: str, bloom_level: str, count: int, difficulty: str
    ) -> List[Dict]:
        bloom_def = BLOOM_DEFINITIONS[bloom_level]
        difficulty_guide = {
            "Easy":   "straightforward questions that a student could answer after a single viewing",
            "Medium": "moderately challenging questions requiring careful attention to the content",
            "Hard":   "difficult questions requiring deep understanding, inference, or critical thinking",
        }[difficulty]

        system_prompt = (
            "You are an expert educational assessment designer specializing in Bloom's Taxonomy. "
            "You create high-quality multiple-choice questions (MCQs) that accurately test learners "
            "at specific cognitive levels. Always base questions STRICTLY on the provided transcript "
            "context — never invent facts not present in the context.\n\n"
            "CRITICAL: Respond ONLY with a valid JSON array. "
            "Do NOT include any preamble, explanation, or markdown code fences."
        )

        user_prompt = f"""Generate exactly {count} MCQ(s) at the **{bloom_level}** level of Bloom's Taxonomy.

## Bloom's Level Definition
- **Level**: {bloom_level}
- **Description**: {bloom_def['description']}
- **Action Verbs to use**: {bloom_def['verbs']}
- **Example question style**: {bloom_def['example']}

## Difficulty
{difficulty_guide}

## Transcript Context (ground all questions in THIS content only)
{context_text}

## Output Format
Return a JSON array of exactly {count} objects. Each object must have:
{{
  "question": "The full question text",
  "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
  "correct_answer": "A) ...",
  "bloom_level": "{bloom_level}",
  "explanation": "2-3 sentences explaining why the answer is correct, referencing the video content",
  "difficulty": "{difficulty}"
}}

Rules:
- All 4 options must be plausible (no obviously wrong distractors)
- correct_answer must be an EXACT string match of one element in options
- Questions must be based ONLY on the provided transcript context
- Use the Bloom's level action verbs in the question stem where appropriate
- Each option must start with A), B), C), or D)
- Return ONLY the JSON array, nothing else"""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user",   "content": user_prompt},
                ],
                temperature=0.4,
                max_tokens=2048,
            )
            raw = response.choices[0].message.content.strip()
            return self._parse_questions(raw, bloom_level, difficulty)

        except Exception as e:
            return [{
                "question":       f"[Generation error for {bloom_level} level: {str(e)[:150]}]",
                "options":        ["A) N/A", "B) N/A", "C) N/A", "D) N/A"],
                "correct_answer": "A) N/A",
                "bloom_level":    bloom_level,
                "explanation":    "Question generation failed. Check your Groq API key and model.",
                "difficulty":     difficulty,
            }]

    def _parse_questions(self, raw: str, bloom_level: str, difficulty: str) -> List[Dict]:
        raw = re.sub(r"```(?:json)?", "", raw).strip().rstrip("`").strip()
        try:
            parsed = json.loads(raw)
        except json.JSONDecodeError:
            m = re.search(r"\[.*\]", raw, re.DOTALL)
            if m:
                try:
                    parsed = json.loads(m.group())
                except Exception:
                    return []
            else:
                return []

        if isinstance(parsed, dict):
            for key in ("questions", "mcqs", "items", "quiz"):
                if key in parsed and isinstance(parsed[key], list):
                    parsed = parsed[key]
                    break
            else:
                parsed = [parsed]

        if not isinstance(parsed, list):
            return []

        validated = []
        for q in parsed:
            if not isinstance(q, dict):
                continue
            if not all(k in q for k in ("question", "options", "correct_answer")):
                continue
            q.setdefault("bloom_level", bloom_level)
            q.setdefault("explanation", "")
            q.setdefault("difficulty",  difficulty)
            validated.append(q)
        return validated
