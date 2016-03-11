import axios from 'axios'
import Rx from 'rx'
import assert from 'assert'

describe('rx axios', () => {
  it('should make http request to api', (done) => {
    let array = ['http://jsonplaceholder.typicode.com/users/1', 'http://jsonplaceholder.typicode.com/users/2']

    function httpGet(url) {
      return axios.get(url)
    }

    let source = Rx.Observable
    .fromArray(array)
    .concatMap(httpGet)
    .toArray()

    let count = 0

    let subscription = source.subscribe(
      function (responses) {
        // console.log(`fire ${count}`)
        // count++
        assert.equal(responses[0].data.name, 'Leanne Graham')
        assert.equal(responses[1].data.name, 'Ervin Howell')
      },
      done,
      done)

  })
})
