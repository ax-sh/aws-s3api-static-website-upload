module.exports = {
  github: {
    release: false,
  },
  npm: {
    publish: false,
  },
  git: {
    changelog: 'git log --pretty=format:"* %s (%h)" ${from}...${to}',
    requireCleanWorkingDir: true,
    requireBranch: false,
    requireUpstream: true,
    requireCommits: false,
    requireCommitsFail: true,
    commitsPath: '',
    addUntrackedFiles: false,
    commit: true,
    commitMessage: 'Release ${version}',
    commitArgs: [],
    tag: true,
    tagExclude: null,
    tagName: null,
    tagMatch: null,
    getLatestTagFromAllRefs: false,
    tagAnnotation: 'Release ${version}',
    tagArgs: [],
    push: true,
    pushArgs: ['--follow-tags'],
    pushRepo: '',
  },
  hooks: {
    'before:init': ['nr eslint'],
    'before:beforeBump': [
      'git flow release start v${version}',
      'echo \uD83D\uDC4A ${name} before:bump latestVersion=v${version} previousVersion=v${latestVersion}',
    ],
    'after:bump': [
      'git cliff -o CHANGELOG.md && git add CHANGELOG.md',
      'git commit  --allow-empty -am "chore: add CHANGELOG"',
      'git flow release finish -n',
      // equivalent 'git flow release finish v${version} -m "Release v${version}" -n -p -F --keepremote',
      'echo \uD83D\uDC4A ${name} after:bump version=v${version} latestVersion=v${latestVersion}',
    ],
    'after:release': [
      'echo \uD83D\uDE4C Successfully released ${name} v${version} to ${repo.repository}.',
      // 'git push origin HEAD',
      // 'git push origin refs/heads/master:master',
      // 'git push origin refs/heads/develop:develop',
    ],
  },
};
