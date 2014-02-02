Template.room_queue_add_track.events({
  // provide a preview
  'keyup #queue_add_track_url': function(e) {
    var thumb_url = Tracks.thumbnail({ url: $('#queue_add_track_url').val() });
    $('#queue_add_track_feedback').html('<img src="' + thumb_url + '" width="80" class="thumbnail">');
  },
  'submit form': function(e) {
    $('#queue_add_track_feedback').html('');
    Meteor.call('queue_add_track', {
      room_id: Session.get('room_id'),
      url: $('#queue_add_track_url').val()
    }, function(error, queue_id) {
      console.log('queue_add_track_url', error, queue_id);
      if (!_.isUndefined(error)) {
        $('#queue_add_track_feedback').html('<div class="alert alert-danger">' + error + '</div>');
        return false;
      }
      $('#queue_add_track_feedback').closest('form').find(':input').val('');
      Session.set('queue_id', queue_id);
      window.location.hash = 'queue';
      setTimeout(function() { window.location.hash = 'queue'; }, 500);
      return false;
    });
    return false;
  }
})

