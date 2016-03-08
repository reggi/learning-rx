import { join } from 'path'
import axios from 'axios'
import Rx from 'rx'
import Promise from 'bluebird'
import crypto from 'crypto'
import fs from 'fs-extra'
import Debug from 'debug'

let debug = Debug('github-repos')

Promise.promisifyAll(fs)

let {
  ensureDirAsync,
  outputJsonAsync } = fs

const GITHUB_USER = 'reggi'

function getRepos (user) {
  let theUrl = `https://api.github.com/users/${user}/repos`
  return axios.get(theUrl)
  .then(result => {
    return result.data
  })
}

function getHash (json) {
  let text = JSON.stringify(json)
  return crypto.createHash('md5').update(text).digest('hex')
}

function createDir (user) {
  return ensureDirAsync(join(__dirname, `/repos-${user}`))
}

function createFile (user, hash, data) {
  return outputJsonAsync(join(__dirname, `/repos-${user}/${hash}.json`), data)
}

// ensureDir('/repos-${GITHUB_USER}')

// Rx.Observable.merge(hashFile, dataStream).zip(createFile)

/*

1) Take github username
2) Create folder based on username (`/repos-${user}`)
3) Get all repos for username (`https://api.github.com/users/${user}/repos`)
4) Get the hash of the repo data
5) Create file where name is hash and content is repo

*/

// Entry point for the streams since this is the common info.  Could be an input stream as well.
let ghUser$ = Rx.Observable.just(GITHUB_USER)

// Ensure user seems to be a side effect that you want to verify completes.
// If you have no need for verification then I would just change this from `map` to `do`
let ensureUser$ = ghUser$
  .map(u => Rx.Observable.fromPromise(createDir(u)))
  .flatMapLatest(x => x)
  .do(() => debug('created user dir'))

// Convert your promise into a stream. makes it easier to work with.
let getRepos$ = ghUser$
  .map(u => Rx.Observable.fromPromise(getRepos(u)))
  .flatMapLatest(x => x)
  .do(() => debug('got user repos'))

// Here's the meat.  We want to only map after we've ensured the user exists - then we want
// to generate some hashes that will be passed along to our file creator/
let repos$ = ensureUser$
  .zip(getRepos$, (_, repos) => repos)
  .map(repo => ({hash: getHash(r), repo}))

let fileWriter$ = Rx.Observable.combineLatest(
    ghUser$,
    repos$,

    // the last function argument to combineLatest is the mapper function. so in this case we're just building up
    // a simple object with the info the user needs.
    (user, repo) => ({user, hash: repo.hash, repo: repo.repo})
  )
  .map(p => {
    return createFile(p.user, p.hash, p.repo)
  })

let reposSubscription = fileWriter$.subscribe(
  function (x) {
    // console.log(JSON.stringify(x, null, 2))
    // console.log('Next: %s', x)
  },
  function (err) {
    // console.log('Error: %s', err)
  },
  function () {
    // console.log('Completed')
  })
