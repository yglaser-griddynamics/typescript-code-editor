import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { AiCompletionService } from './ai-completion.service';

describe('AiCompletionService', () => {
  let service: AiCompletionService;  
  const mockFetch = (response: any, ok = true) => {
    return Promise.resolve({
      ok,
      status: ok ? 200 : 500,
      json: () => Promise.resolve(response),
    } as Response);
  };

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AiCompletionService);

    vi.restoreAllMocks();
    vi.spyOn(window, 'fetch');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers(); 
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

    
    vi.mocked(window.fetch).mockReturnValue(mockFetch(response));

    const result = await service.getCompletions({ fullText: 'code', cursorPosition: 4 });

    expect(result.suggestions[0].label).toBe(mockText);
  });

  it('should retry 3 times on failure', async () => {
    
    vi.useFakeTimers();

    
    vi.mocked(window.fetch).mockReturnValue(
      Promise.resolve({
        ok: false,
        status: 500,
        json: async () => ({}),
      } as Response)
    );

    
    const promise = service.getCompletions({ fullText: 'retry', cursorPosition: 5 });

  
    await vi.advanceTimersByTimeAsync(1000); 
    await vi.advanceTimersByTimeAsync(2000); 
    await vi.advanceTimersByTimeAsync(4000); 

    
    await promise;

    expect(window.fetch).toHaveBeenCalledTimes(4);
  });

  it('should return empty array on catastrophic failure', async () => {
   
    vi.useFakeTimers();
    vi.mocked(window.fetch).mockRejectedValue(new Error('Network down'));

 
    const promise = service.getCompletions({ fullText: 'fail', cursorPosition: 4 });


    await vi.advanceTimersByTimeAsync(8000);

    const res = await promise;

    expect(res.suggestions).toEqual([]);
  });
});
