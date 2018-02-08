module.exports.authFailed = function(res) {
  res.status(401).
      send({
        success: false,
        message: 'Authentication failed.'
      });
};