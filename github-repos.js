import axios from 'axios'
import Rx from 'rx'
import Promise from 'bluebird'
import crypto from 'crypto'
import fs from 'fs-extra'

Promise.promisifyAll(fs)

let {
  ensureDir,
  outputJson } = fs

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

function createFile (hash, data) {
  return outputJson(`/repos/${hash}.json`, data)
}

// ensureDir('/repos')

let repos = Rx.Observable.fromPromise(getRepos(GITHUB_USER))

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

// make request to get all github repos
// ensure a folder called "/repos" exists
// get the hash of the repo data
// save individual data as a json file where the name of the file is the hash
