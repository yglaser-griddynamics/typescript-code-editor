import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { AiCompletionService } from './ai-completion.service';

describe('AiCompletionService', () => {
  let service: AiCompletionService;

  // Helper to mock fetch responses quickly
  const mockFetch = (response: any, ok = true) => {
    return Promise.resolve({
      ok,
      status: ok ? 200 : 500,
      json: () => Promise.resolve(response),
    });
  };

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AiCompletionService);
    spyOn(window, 'fetch');
  });

  it('should return empty suggestions for empty context', async () => {
    const res = await service.getCompletions({ fullText: '', cursorPosition: 0 });
    expect(res.suggestions).toEqual([]);
    expect(window.fetch).not.toHaveBeenCalled();
  });

  it('should parse valid API response', async () => {
    const mockText = 'console.log("test")';
    const response = {
      candidates: [{ content: { parts: [{ text: `\`\`\`javascript\n${mockText}\n\`\`\`` }] } }],
    };

    (window.fetch as jasmine.Spy).and.returnValue(mockFetch(response));

    const result = await service.getCompletions({ fullText: 'code', cursorPosition: 4 });

    expect(result.suggestions[0].label).toBe(mockText);
  });

  it('should retry 3 times on failure', fakeAsync(() => {
    (window.fetch as jasmine.Spy).and.returnValue(Promise.resolve({ ok: false, status: 500 }));

    service.getCompletions({ fullText: 'retry', cursorPosition: 5 });

    // Fast-forward through backoff delays (1s, 2s, 4s)
    tick(1000);
    tick(2000);
    tick(4000);

    // Initial call + 3 retries = 4 calls
    expect(window.fetch).toHaveBeenCalledTimes(4);
  }));

  it('should return empty array on catastrophic failure', async () => {
    (window.fetch as jasmine.Spy).and.rejectWith(new Error('Network down'));

    // Bypass retries for this test to keep it sync-ish, or just expect the catch block
    // forcing quick failure by mocking private MAX_RETRIES if needed,
    // but here we just check the final catch block.
    const res = await service.getCompletions({ fullText: 'fail', cursorPosition: 4 });
    expect(res.suggestions).toEqual([]);
  });
});
