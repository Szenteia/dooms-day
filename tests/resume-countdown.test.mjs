import test from 'node:test';
import assert from 'node:assert/strict';
import { createResumeCountdown } from '../dist/resume-countdown.js';

test('resume waits three seconds and completes exactly once', () => {
  const element={hidden:true};
  const countdown=createResumeCountdown(element);
  countdown.start();
  assert.equal(element.textContent,'Folytatás · 3');
  assert.equal(element.hidden,false);
  assert.equal(countdown.update(1),false);
  assert.equal(element.textContent,'Folytatás · 2');
  assert.equal(countdown.update(1),false);
  assert.equal(element.textContent,'Folytatás · 1');
  assert.equal(countdown.update(1),true);
  assert.equal(element.hidden,true);
  assert.equal(countdown.update(1),false);
});

test('interruption cancels completion and restarting restores the full delay', () => {
  const element={hidden:true};
  const countdown=createResumeCountdown(element);
  countdown.start();
  countdown.update(2);
  countdown.clear();
  assert.equal(countdown.update(10),false);
  assert.equal(element.hidden,true);
  countdown.start();
  assert.equal(countdown.update(2),false);
  assert.equal(element.textContent,'Folytatás · 1');
  assert.equal(countdown.update(1),true);
});

test('elapsed time determines the delay at different frame rates', () => {
  for(const fps of [30,60,120]) {
    const countdown=createResumeCountdown({hidden:true});
    countdown.start();
    let elapsed=0, completed=false;
    for(let i=0;i<fps*4&&!completed;i++) {
      completed=countdown.update(1/fps);
      elapsed+=1/fps;
    }
    assert.ok(completed);
    assert.ok(elapsed>=3-1e-10 && elapsed<=3+1/fps+1e-10);
  }
});
