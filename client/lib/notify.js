(function() {


// Notifications based on $.bootstrapGrowl()
//   mrt add bootstrap-growl
//

Notify = {
  options: {
    ele: 'body', // which element to append to
    type: 'info', // (null, 'info', 'error', 'success')
    offset: {from: 'top', amount: 20}, // 'top', or 'bottom'
    align: 'right', // ('left', 'right', or 'center')
    width: 250, // (integer, or 'auto')
    delay: 4000,
    allow_dismiss: true,
    stackup_spacing: 10 // spacing between consecutively stacked growls.
  },
  optionize: function(options) {
    if (_.isObject(options)) {
      return _.extend(this.options, options);
    }
    return this.options;
  },
  alert: function(message, options) {
    $.bootstrapGrowl(message, _.extend(this.optionize(options), {type: 'alert'}));
  },
  info: function(message, options) {
    $.bootstrapGrowl(message, _.extend(this.optionize(options), {type: 'info'}));
  },
  error: function(message, options) {
    $.bootstrapGrowl(message, _.extend(this.optionize(options), {type: 'danger'}));
  },
  success: function(message, options) {
    $.bootstrapGrowl(message, _.extend(this.optionize(options), {type: 'success'}));
  },
  // clear all existing notificiations
  clear: function() {
    $('.bootstrap-growl').remove();
  },
  // callback for Meteor.call() -- standarizing Notify messags
  callback: function(error, results) {
    if (error) {
      console.log('Notify.callback', {error: error, results: results});
      if (_.isString(error)) {
        Notify.error(error);
        return false;
      }
      Notify.error(error.message);
      return false;
    }
    if (_.isBoolean(results)) {
      Notify.success('Success');
      return true;
    }
    if (_.isNull(results)) {
      return true;
    }
    Notify.success(results);
    return true;
  }
}


}());

