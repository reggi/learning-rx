import Rx from 'rx'
import hyperquest from 'hyperquest'

const SHOP = process.env.SHOP
const PASS = process.env.PASS

console.log(SHOP)
console.log(PASS)

let apiStream = Rx.Observable.create(function(observer) {
	let apiUrl = `https://${SHOP}/admin/shop.json`
	let req = hyperquest(apiUrl, {
    'method': 'GET',
    'headers': {
      'X-Shopify-Access-Token': PASS
    }
  })
	req.on('response', function (res) {
		observer.onNext(res)
	});
	req.on('error', function(res) {
    observer.onError(res)
	})
})

var subsciption = apiStream.subscribe(
	function (x) { console.log(x); },
	function (e) { console.log('onError %s', e); },
	function () { console.log('onCompleted'); }
)
