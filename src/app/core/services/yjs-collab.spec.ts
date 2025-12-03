import { TestBed } from '@angular/core/testing';

import { YjsCollab } from './yjs-collab';

describe('YjsCollab', () => {
  let service: YjsCollab;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(YjsCollab);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
