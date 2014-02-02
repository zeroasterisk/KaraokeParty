Template.rooms_create_form.events({
  'submit form': function(e) {
    $('#rooms_create_feedback').html('');
    Meteor.call('rooms_create', {
      name: $('#rooms_create_name').val(),
      desc: $('#rooms_create_desc').val()
    }, function(error, room_id) {
      if (!_.isUndefined(error)) {
        $('#rooms_create_feedback').html('<div class="alert alert-danger">' + error + '</div>');
        return false;
      }
      $('#rooms_create_feedback').closest('form').find(':input').val('');
      Session.set('room_id', room_id);
      Router.go('/room/' + room_id);
      return false;
    });
    return false;
  }
})
