import axios from 'axios'
import Rx from 'rx'

const GITHUB_USER = 'reggi'

function getRepos (user){
  let theUrl = `https://api.github.com/users/${user}/repos`
  return axios.get(theUrl)
}
