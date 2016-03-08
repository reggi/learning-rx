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
  let str = JSON.stringify(json)
  return crypto.createHmac('sha256', str)
}

function createDir (user) {
  return ensureDirAsync(join(__dirname, `/repos-${user}`))
}

function createFile (hash, data) {
  return outputJsonAsync(join(__dirname, `/repos/${hash}.json`), data)
}

// ensureDir('/repos-${GITHUB_USER}')

// let repos = Rx.Observable.fromPromise(getRepos(GITHUB_USER))

// Rx.Observable.merge(hashFile, dataStream).zip(createFile)

let repos = Rx.Observable.just(GITHUB_USER)
  .map(user => {
    return createDir(user)
  })
  .map(user => {
    return getRepos(user)
  })

/*

1) Take github username
2) Create folder based on username (`/repos-${user}`)
3) Get all repos for username (`https://api.github.com/users/${user}/repos`)
4) Get the hash of the repo data
5) Create file where name is hash and content is repo

*/

let reposSubscription = repos.subscribe(
  function (x) {
    console.log(x)
    console.log('Next: %s', x)
  },
  function (err) {
    console.log('Error: %s', err)
  },
  function () {
    console.log('Completed')
  })
