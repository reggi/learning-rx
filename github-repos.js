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
  let file = join(__dirname, `/repos-${user}/${hash}.json`)
  return outputJsonAsync(file, data)
    .then(() => file)
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
  .do((u) => debug(`pulling ${u}`))

// Ensure user seems to be a side effect that you want to verify completes.
// If you have no need for verification then I would just change this from `map` to `do`
let ensureUser$ = ghUser$
  .do((u) => debug(`ensuring directory for: ${u}`))
  .map(u => Rx.Observable.fromPromise(createDir(u)))
  .flatMapLatest(x => x)

// Convert your promise into a stream. makes it easier to work with.
let getRepos$ = ghUser$
  .do((u) => debug(`fetching user repos for: ${u}`))
  .map(u => Rx.Observable.fromPromise(getRepos(u)))
  .flatMapLatest(x => x)

// Here's the meat.  We want to only map after we've ensured the user exists - then we want
// to generate some hashes that will be passed along to our file creator/
let repos$ = ensureUser$
  .zip(getRepos$, (_, repos) => repos)
  .flatMap(repos => {
    return Rx.Observable.from(repos.map(repo => ({hash: getHash(repo), repo})))
  })

let fileWriter$ = Rx.Observable.combineLatest(
    ghUser$,
    repos$,
    (user, repo) => ({user, hash: repo.hash, repo: repo.repo})
  )
  .map(p => {
    return createFile(p.user, p.hash, p.repo)
  })
  .flatMap(f => f)
  .do((file) => debug(`wrote a new repo to json ${file}`))
  .toArray()

fileWriter$.subscribe(
  function (x) {
    debug('subscribe')
  },
  function (err) {
    console.log('Error: %s', err)
  },
  function () {
    debug('completed')
  })
