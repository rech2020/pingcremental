// a global list of api returns for things that don't need to be called multiple times

const githubContributors = await fetch('https://api.github.com/repos/monkeyswithpie/pingcremental/contributors')

module.exports = {
    githubContributors
}