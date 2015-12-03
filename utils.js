var _ = require('lodash');

/**
 * Generates a theme description from a JSON file
 */

var parseConfigFile = function(json) {
  var content = '';
  var comment = '';

  _.forEach(json, function(value, key) {
    if (key === 'comment') {
      comment = value;
    } else {
      key = _.startCase(key).replace('Uri', 'URI');

      if (_.isArray(value)) {
        value = value.join(', ');
      }

      if (!_.isEmpty(value)) {
        content += key + ': ' + value + '\n';
      }
    }
  });

  if (!_.isEmpty(comment)) {
    content = content + '\n' + comment;
  }

  return content;
};

module.exports = {
  parseConfigFile: parseConfigFile
};