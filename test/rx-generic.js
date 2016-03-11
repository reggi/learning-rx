import Rx from 'rx'
import { ok } from 'assert'

function createMessage(expected, actual) {
  return 'Expected: [' + expected.toString() + ']\r\nActual: [' + actual.toString() + ']';
}

// Using QUnit testing for assertions
var collectionAssert = {
  assertEqual: function (actual, expected) {
    var comparer = Rx.internals.isEqual, isOk = true;

    if (expected.length !== actual.length) {
      ok(false, 'Not equal length. Expected: ' + expected.length + ' Actual: ' + actual.length);
      return;
    }

    for(var i = 0, len = expected.length; i < len; i++) {
      isOk = comparer(expected[i], actual[i]);
      if (!isOk) {
        break;
      }
    }

    ok(isOk, createMessage(expected, actual));
  }
};

var onNext = Rx.ReactiveTest.onNext,
  onCompleted = Rx.ReactiveTest.onCompleted,
  subscribe = Rx.ReactiveTest.subscribe;

describe('buffer', function () {
  it ('should join strings', () => {
    var scheduler = new Rx.TestScheduler();

    var input = scheduler.createHotObservable(
      onNext(100, 'abc'),
      onNext(200, 'def'),
      onNext(250, 'ghi'),
      onNext(300, 'pqr'),
      onNext(450, 'xyz'),
      onCompleted(500)
    );

    var results = scheduler.startScheduler(
      function () {
        return input.buffer(function () {
          return input.debounce(100, scheduler);
        })
        .map(function (b) {
          return b.join(',');
        });
      },
      {
        created: 50,
        subscribed: 150,
        disposed: 600
      }
    );

    collectionAssert.assertEqual(results.messages, [
      onNext(400, 'def,ghi,pqr'),
      onNext(500, 'xyz'),
      onCompleted(500)
    ]);

    collectionAssert.assertEqual(input.subscriptions, [
      subscribe(150, 500),
      subscribe(150, 400),
      subscribe(400, 500)
    ]);
  })
});
