Template.room_queue_listing.linkCB = function(event) {
  var method = $(event.currentTarget).attr('rel');
  Meteor.call(method, {
    room_id: Session.get('room_id'),
    queue_id: $(event.currentTarget).data('id')
  }, function(error, message) {
    console.log('room_queue_listing.link', method, error, message);
    if (!_.isUndefined(error)) {
      return Notify.error(error);
    }
    return Notify.success(message);
  });
  return false;
};

Template.room_queue_listing.events({
  'click a.queue_top': Template.room_queue_listing.linkCB,
  'click a.queue_up': Template.room_queue_listing.linkCB,
  'click a.queue_down': Template.room_queue_listing.linkCB,
  'click a.queue_end': Template.room_queue_listing.linkCB,
  'click a.queue_remove': Template.room_queue_listing.linkCB,
  'click a.queue_reload': Template.room_queue_listing.linkCB,
});

Template.room_queue_add.helpers({
  tracks: function() {
    return Tracks.search(Session.get('queue_add_search'));
  }
});
Template.room_queue_add.events({
  'keyup input#queue_add_search': function(event) {
    Session.set('queue_add_search', $(event.currentTarget).val());
  },
  'submit form': function(event) {
    return false;
  },
  'click a.add_track': function(event) {
    Meteor.call('queue_add', {
      room_id: Session.get('room_id'),
      track_id: $(event.currentTarget).data('id')
    }, function(error, message) {
      if (!_.isUndefined(error)) {
        return Notify.error(error);
      }
      window.location.hash = 'queue';
    });
  }
});

Template.room_search_youtube.helpers({
  videos: function() {
    // https://developers.google.com/youtube/v3/docs/search/list
    var term = Session.get('youtube_search');
    var url = "https://www.googleapis.com/youtube/v3/search";
    var query = "key=AIzaSyDUt-SLlrQrXGy5j42xHh0L-bDqzYwJjrE" +
      "&part=snippet" +
      "&regionCode=US" +
      "&safeSearch=none" +
      "&type=video" +
      "&maxResults=40" +
      "&videoEmbeddable=true" +
      "&order=viewCount" +
      "&q=karaoke+words+" +
        "-performs+" +
        "-performance+" +
      /*
        "-impression+" +
        "-live+" +
        */
        escape(term).replace(/ /, '+');
    var videos = [];
    console.log('youtube-search-init', term);
    $.ajax({
      async: false,
      url: url,
      data: query,
      success: function(data) {
        console.log('youtube-search-success', data);
        videos = data.items;
      }
    });
    console.log('youtube-search-response', videos);
    return videos;
  }
});
Template.room_search_youtube.events({
  'keyup #youtube_search': function(e) {
    Session.set('youtube_search', $(event.currentTarget).val());
  },
  'click a.add_track': function(e) {
    console.log('add_youtube', e);
    Meteor.call('queue_add_track', {
      room_id: Session.get('room_id'),
      type: 'yt',
      url: '//www.youtube.com/embed/' + $(e.currentTarget).data('id')
    }, function(error, queue_id) {
      if (!_.isUndefined(error)) {
        Notify.error(error);
        return false;
      }
      Session.set('queue_id', queue_id);
      window.location.hash = 'queue';
      setTimeout(function() { window.location.hash = 'queue'; }, 500);
      return false;
    });
    return false;
  }
});
Template.room_queue_add_track_youtube.events({
  // provide a preview
  'keyup #queue_add_track_url': function(e) {
    var thumb_url = Tracks.thumbnail({ url: $('#queue_add_track_url').val() });
    $('#queue_add_youtube .feedback').html('<img src="' + thumb_url + '" width="80" class="thumbnail">');
  },
  'submit form': function(e) {
    $('#queue_add_youtube .feedback').html('');
    Meteor.call('queue_add_track', {
      room_id: Session.get('room_id'),
      type: 'yt',
      url: $('#queue_add_track_url').val()
    }, function(error, queue_id) {
      console.log('queue_add_track_url', error, queue_id);
      if (!_.isUndefined(error)) {
        $('#queue_add_youtube .feedback').html('<div class="alert alert-danger">' + error + '</div>');
        return false;
      }
      $('#queue_add_youtube .feedback').closest('form').find(':input').val('');
      Session.set('queue_id', queue_id);
      window.location.hash = 'queue';
      setTimeout(function() { window.location.hash = 'queue'; }, 500);
      return false;
    });
    return false;
  }
})
Template.room_queue_add_track_cdg_upload.events({
  'submit form': function(e) {
    $('#queue_add_cdg .feedback').html('');
    Meteor.call('queue_add_track', {
      room_id: Session.get('room_id'),
      type: 'cdg',
      artist: $('#queue_add_artist').val(),
      title: $('#queue_add_title').val(),
      url_mp3: $('#queue_add_mp3_url').val(),
      url_cdg: $('#queue_add_cdg_url').val()
    }, function(error, queue_id) {
      console.log('queue_add_track_url', error, queue_id);
      if (!_.isUndefined(error)) {
        $('#queue_add_cdg .feedback').html('<div class="alert alert-danger">' + error + '</div>');
        return false;
      }
      $('#queue_add_cdg .feedback').closest('form').find(':input').val('');
      Session.set('queue_id', queue_id);
      window.location.hash = 'queue';
      setTimeout(function() { window.location.hash = 'queue'; }, 500);
      return false;
    });
    return false;
  }
})

