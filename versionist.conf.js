'use strict';

var fs = require('fs');

module.exports = {
  subjectParser: 'angular',
  editChangelog: true,
  editVersion: false,
  template: fs.readFileSync( __dirname + '/doc/CHANGELOG.hbs', 'utf8' ),
  addEntryToChangelog: {
    preset: 'prepend',
    fromLine: 5
  },
  getIncrementLevelFromCommit: (commit) => {
    if( commit.subject.type == 'feat' )
      return 'minor';
    return 'patch';
  },
  transformTemplateData: (data) => {

    console.log( data )

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
