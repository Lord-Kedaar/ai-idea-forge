# Product Scope — AI Idea Forge MVP

## Cel produktu

AI Idea Forge to narzędzie do transformowania surowych pomysłów w ustrukturyzowane **Decision Memo** poprzez wielokrokowy workflow prowadzony przez multi-agent AI pipeline.

## Core value proposition

Użytkownik wprowadza pomysł / temat, wybiera tryb pracy, a system orkiestruje sekwencję agentów AI, z których każdy wnosi unikalną perspektywę. Wynikiem jest spójne Decision Memo gotowe do decyzji.

## Workflow tryby (5)

| Tryb | Opis | Agenci |
|------|------|--------|
| Quick Insight | Szybka analiza, 2-3 agenci | Context Analyst + Decision Mapper |
| Deep Analysis | Pełna analiza, 5-6 agentów | all + Risk Assessor + Stakeholder Mapper |
| Creative Spark | Burza mózgów + synteza | all + Creative Generator + Idea Consolidator |
| Expert Review | Recenzja istniejącego pomysłu | all + Expert Critic + Refinement Advisor |
| Custom | Użytkownik wybiera agenci | Konfigurowalny skład |

## Agenci MVP (8)

1. **Context Analyst** — bada tło i powiązania tematu
2. **Decision Mapper** — identyfikuje decyzję kluczową
3. **Option Generator** — generuje warianty rozwiązań
4. **Risk Assessor** — ocenia ryzyka i konsekwencje
5. **Stakeholder Mapper** — mapuje interesariuszy i ich perspektywy
6. **Creative Generator** — generuje nietypowe rozwiązania
7. **Idea Consolidator** — konsoliduje i syntetyzuje wyniki
8. **Expert Critic** — krytyczna recenzja z lukami

## Endpointy API

- `GET /health` — liveness
- `GET /api/providers` — lista dostępnych providerów AI
- `GET /api/agents` — lista agentów z profilami
- `GET /api/workflows` — lista workflow trybów
- `POST /api/forge/runs` — tworzy nowy forge run
- `GET /api/forge/runs/:runId` — status run
- `GET /api/forge/runs/:runId/events` — SSE stream
- `GET /api/forge/runs/:runId/artifacts/decision-memo` — final artifact

## Poza MVP

- Persystencja runów w bazie danych (MVP: filesystem)
- Autentykacja / autoryzacja
- Więcej niż 8 agentów
- Plugin system dla agentów
