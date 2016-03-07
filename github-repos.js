import axios from 'axios'
import Rx from 'rx'

const GITHUB_USER = 'reggi'

function getRepos (user){
  let theUrl = `https://api.github.com/users/${user}/repos`
  return axios.get(theUrl)
}

// make request to get all github repos
// ensure a folder called "/repos" exists
// get the hash of the repo data
// save individual data as a json file where the name of the file is the hash
