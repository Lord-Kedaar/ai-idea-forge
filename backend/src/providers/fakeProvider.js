/**
 * AI Idea Forge — Fake Provider
 * Używany do testów offline i developmentu bez realnego LLM.
 */

export class FakeProvider {
  constructor(config = {}) {
    this.providerId = 'fake';
    this.model = config.model || 'fake-model';
  }

  /**
   * Simuluje odpowiedź chat completion.
   * Zwraca deterministyczny fake output na podstawie inputu.
   */
  async chatCompletion({ messages, temperature = 0.7, maxTokens = 500, abortSignal } = {}) {
    if (abortSignal?.aborted) {
      throw new Error('Aborted');
    }

    const lastMessage = messages[messages.length - 1]?.content || '';
    const agent = this._detectAgent(messages);

    // Fake responses per agent role
    const responses = {
      generator: `## Rozwinięcie pomysłu\n\nNa podstawie "${lastMessage.slice(0, 50)}..." oto rozwinięcie:\n\n1. **Pierwszy wariant**: Podejście konserwatywne — minimalny scope, szybki win.\n2. **Drugi wariant**: Podejście ewolucyjne — stopniowe zmiany z monitoringiem.\n3. **Trzeci wariant**: Podejście rewolucyjne — fundamentalna zmiana podejścia.\n\nKażdy wariant ma swoje ryzyka i wymagania zasobowe.`,
      skeptic: `## Krytyka\n\n**Słabe punkty:**\n- Założenie że rynek jest gotowy na zmianę\n- Niedoszacowane koszty wdrożenia\n- Zależność od zewnętrznego dostawcy\n\n**Ukryte założenia:**\n- Użytkownicy zaakceptują nowy interfejs bez oporu\n- Zespół ma wystarczające kompetencje\n- Budżet nie zostanie obcięty w trakcie\n\n**Niepewności:**\n- Brak danych historycznych dla podobnych projektów\n- Konkurencja może zareagować szybciej`,
      pragmatist: `## Ocena wykonalności\n\n**Wymagane zasoby:**\n- Zespół: 2-3 osoby przez 8-12 tygodni\n- Budżet: ~80-120k PLN\n- Infrastruktura: istniejąca\n\n**Minimalny eksperyment:**\nPrzeprowadzić 2-tygodniowy spike z jednym użytkownikiem pilotażowym, zmierzyć czas na ukończenie zadania.\n\n**Rekomendacja scope:**\nOgraniczyć do MVP obejmującego 1 główny przypadek użycia.`,
      redteam: `## Pre-mortem\n\n**Ryzyka techniczne:**\n- Awaria integracji z istniejącym systemem\n- Problemy z wydajnością przy skali\n\n**Ryzyka operacyjne:**\n- Opóźnienia z powodu brakujących kompetencji\n- Rotacja kluczowych osób\n\n**Ryzyka finansowe:**\n- Przekroczenie budżetu o 30-50%\n- Koszty utrzymania niedoszacowane\n\n**Ryzyka reputacyjne:**\n- Negatywne PR przy nieudanym wdrożeniu\n- Utrata zaufania u użytkowników`,
      editor: `## Synteza\n\n**Fakty:**\n- Pomysł ma realne uzasadnienie biznesowe\n- Zespół ma kompetencje techniczne\n- Istniejący system pozwala na integrację\n\n**Założenia:**\n- Budżet zostanie utrzymany\n- Użytkownicy zaakceptują zmianę\n\n**Poziom niepewności:** Średni — wymaga walidacji przez eksperyment.`,
      decider: `## Rekomendacja\n\n**Status:** GO z zastrzeżeniami\n\n**Następny krok:** Uruchomić 2-tygodniowy spike z użytkownikiem pilotażowym, zmierzyć metricę sukcesu przed skalowaniem.\n\n**Poziom niepewności:** Średni\n\n**Warunek:** Jeśli spike wykaże czas >X, przejść do REVISE.`,
    };

    const content = responses[agent] || `Odpowiedź agenta ${agent} na: "${lastMessage.slice(0, 80)}..."`;

    // Simulate network delay
    await new Promise(r => setTimeout(r, 300));

    return {
      providerId: this.providerId,
      model: this.model,
      content,
      reasoning: null,
      usage: { promptTokens: 50, completionTokens: 80, totalTokens: 130 },
      finishReason: 'stop',
      raw: {},
    };
  }

  _detectAgent(messages) {
    const system = messages.find(m => m.role === 'system')?.content || '';
    if (system.includes('Generator')) return 'generator';
    if (system.includes('Sceptyk')) return 'skeptic';
    if (system.includes('Pragmatyk')) return 'pragmatist';
    if (system.includes('Red Team')) return 'redteam';
    if (system.includes('Redaktor')) return 'editor';
    if (system.includes('Decydent')) return 'decider';
    return 'generator';
  }
}
