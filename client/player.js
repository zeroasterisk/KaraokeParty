
Template.player.rendered = function() {
  // setup "constants"
  Template.player.start = 0;
  Template.player.autoplay = false;
  // setup "players"
  playerYouTube.setup();
  //Template.player.play();
};

/**
 * Resize the player
 * - for a "host" it's the full width of the page
 * - for everyone else, it's only when on the player tab
 *
 * @param data
 * @return data (+width +height)
 */
Template.player.size = function(data) {
  if (!_.isObject(data)) {
    data = {};
  }
	return data;
  if (Session.get('isHost')) {
    data.width = $(window).width();
  } else {
    data.width = $('#room_area').width();
  }
  // 4:3 aspect ratio
  data.height = Math.round(data.width * 3 / 4);
  // size #player
  $("#player").parent().css({
    position: 'relative',
    width: data.width,
    height: data.height,
    top: 0,
    left: 0
  });
  // get "offset" of the #player
  data.offset = $("#player").offset();
  if (!_.isObject(data.offset) || !_.has(data.offset, 'left')) {
    data.offset = {left: 0, top: 0};
  }
  if (Session.get('isHost')) {
    data.offset.left = 0;
  }
  // position player
  $('#player').css({
    position: 'absolute',
    width: data.width,
    height: data.height,
    left: data.offset.left,
    top: data.offset.top
  });
  // if it contains an iframe, resize that too (no positioning)
  if ($('#player iframe')) {
    $('#player iframe').css({
      width: data.width,
      height: data.height
    });
  }
  return data;
};


Template.player.play = function() {
  var playing = Queues.playing(Session.get('room_id'));
  console.error('player.play', playing);
  if (!playing) {
    return;
  }
  // data for player layout
  var data = {
    url: playing.url,
    start: Math.round(_.has(playing, 'start') ? playing.start : 1)
  };
  // (re)size player
  Template.player.size(data);
  console.log('playing.play: data', data);
  // setup player constants
  Template.player.start = data.start;
  // player - YouTube
  if (playing.url.indexOf('youtube.com')) {
    playerYouTube.playInit(data);
    playerYouTube.playApi(data);
    return;
  }
  // player - HTML
  playerHTML5(data);
  playerHTML5Api(data);
  return;
};

// trigger a pause of the player, whatever type of player it is
Template.player.pause = function() {
  console.log('player_pause');
  if ($('#player_area').data('type') == 'youtube') {
    playerYouTube.pause();
  }
}

// -----------------------
// callbacks (data from external players)
// -----------------------
// callback abstract, should be triggered by various player types
Template.player.onStateChange = function(data) {
  console.log('playing_state', data);
  Meteor.call('playing_state', {
    room_id: Session.get('room_id'),
    state: data.state,
    start: data.start
  });
}



// -------------------------------
// Player Controls
Template.player.events({
  'click #playing_prev': function(e) {
    Template.player.pause();
    Meteor.call('playing_prev', Session.get('room_id'), function(error, response) {
      if (response) {
        Template.player.play();
      }
    });
    return false;
  },
  'click #playing_pause': function(e) {
    Template.player.pause();
    Meteor.call('playing_pause', Session.get('room_id'));
    return false;
  },
  'click #playing_play': function(e) {
    Meteor.call('playing_play', Session.get('room_id'), function(error, response) {
      if (response) {
        Template.player.play();
      }
    });
    return false;
  },
  'click #playing_next': function(e) {
    Template.player.pause();
    Meteor.call('playing_next', Session.get('room_id'), function(error, response) {
      if (response) {
        Template.player.play();
      }
    });
    return false;
  }
});
