import { TestBed } from '@angular/core/testing';

import { AiApi } from './AiCompletion.service';

describe('AiApi', () => {
  let service: AiApi;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AiApi);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
