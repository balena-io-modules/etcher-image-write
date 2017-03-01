'use strict';

module.exports = {
  subjectParser: 'angular',
  editChangelog: true,
  editVersion: false,
  addEntryToChangelog: {
    preset: 'prepend',
    fromLine: 5
  },
  getIncrementLevelFromCommit: (commit) => {
    if( /(feat)/i.test( commit.subject.type ) )
      return 'minor'
    return 'patch';
  },
  transformTemplateData: (data) => {

    data.features = data.commits.filter((commit) => {
      return commit.subject.type === 'feat';
    });

    data.fixes = data.commits.filter((commit) => {
      return commit.subject.type === 'fix';
    });

    data.misc = data.commits.filter((commit) => {
      return ![ 'fix', 'feat' ].includes(commit.subject.type);
    });

    return data;

  },
}
