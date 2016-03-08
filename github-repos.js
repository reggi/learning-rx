import { join } from 'path'
import axios from 'axios'
import Rx from 'rx'
import Promise from 'bluebird'
import crypto from 'crypto'
import fs from 'fs-extra'

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

let x = Rx.Observable.fromPromise(createDir(GITHUB_USER))

// Rx.Observable.merge(hashFile, dataStream).zip(createFile)

/*

1) Take github username
2) Create folder based on username (`/repos-${user}`)
3) Get all repos for username (`https://api.github.com/users/${user}/repos`)
4) Get the hash of the repo data
5) Create file where name is hash and content is repo

*/

let repos = Rx.Observable.just(GITHUB_USER)
.flatMap(user => Promise.props({
  dir: createDir(user),
  repo: getRepos(user),
  user: Promise.resolve(user)
}))
.flatMap(data => {
  return data.repo
})
.flatMap(repo => Promise.props({
  hash: getHash(repo),
  repo: repo
}))
.map(repo => {
  return createFile(GITHUB_USER, repo.hash, repo.repo)
})

let reposSubscription = repos.subscribe(
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
