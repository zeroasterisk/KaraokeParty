Template.player.youTubeApi = false;
Template.player.rendered = function() {
  Template.player.setupYouTube();
  Template.player.play();
};

onYouTubeIframeAPIReady = function() {
  console.log('youTubePlayer.apiready');
  Template.player.youTubeApi = true;
  Template.player.play();
};


Template.player.setupYouTube = function() {
  if (_.has(Template.player, 'setupYouTubeDone') && Template.player.setupYouTubeDone) {
    return;
  }
  Template.player.setupYouTubeDone = true;
  var tag = document.createElement('script');
  tag.src = "https://www.youtube.com/iframe_api";
  var firstScriptTag = document.getElementsByTagName('script')[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
};
// setup this video (all DOM interactions)
Template.player.playYouTube = function(data) {
  data.videoId = Tracks.getIdYouTube(data.url);
  if ($('#player_area').data('videoId') == data.videoId) {
    // video loaded
    console.log('playing.play: video-loaded', data);
    return;
  }
  // load video
  data.yturl = 'http://' + data.url + '?autoplay=1&controls=0&enablejsapi=1&modestbranding=1&rel=0&theme=light&start' + data.start;
  console.log('playing.play: video-load', data);
  $('#player_area')
    .data('type', 'youtube')
    .data('videoId', data.videoId)
    .data('videoApiLoaded', null)
    .data('videoStart', data.start)
    .html(_.template('<iframe id="ytplayer" width="<%= width %>" height="<%= height %>" src="<%= yturl %>" frameborder="0" allowfullscreen></iframe>', data));
  console.log('playing.play: video-load:done', data);

  // setup monitoring on an interval
  if (_.has(Template.player, 'monitorId')) {
    Meteor.clearInterval(Template.player.monitorId);
  }
  Template.player.monitorId = Meteor.setInterval(function() {
    if ($('#player_area').data('videoApiLoaded') != $('#player_area').data('videoId')) {
      //console.log('Meteor.setInterval-skipped-videoIdsDoNotMatch');
      return;
    }
    if (!_.has(Template.player, 'youTubePlayer')) {
      //console.log('Meteor.setInterval-skipped-missing-youTubePlayer');
      return;
    }
    if (Template.player.youTubePlayer.getPlayerState() != 1) {
      //console.log('Meteor.setInterval-skipped-not-playing');
      return;
    }
    var currentTime = Template.player.youTubePlayer.getCurrentTime();
    if (Math.abs($('#player_area').data('videoStart') - currentTime) < 2) {
      //console.log('Meteor.setInterval-skipped-start-in-sync');
      return;
    }
    Meteor.call('playing_state', {
      room_id: Session.get('room_id'),
      start: currentTime,
    });
  }, 2000);
};
// trigger YouTube events
Template.player.playYouTubeApi = function(data) {
  // setup youTubePlayer
  if (!Template.player.youTubeApi) {
    // callback will auto-re-play
    console.log('player.playYouTubeApi: skip');
    return;
  }
  if ($('#player_area').data('videoApiLoaded') == data.videoId) {
    console.log('player.playYouTubeApi: loaded');
    if (_.has(Template.player.youTubePlayer, 'getPlayerState') && Template.player.youTubePlayer.getPlayerState() == 1) {
      console.log('player.playYouTubeApi: playing');
      return;
    }
    Template.player.youTubePlayer.playVideo();
    return;
  }
  // YouTube is ready, but we don't have the player "started" on this object
  console.log('player.playYouTubeApi: load', data, Tracks.getIdYouTube(data.url));
  $('#player_area').data('videoApiLoaded', data.videoId);
  // setup the Object
  Template.player.youTubePlayer = new YT.Player('ytplayer', {
    height: data.height,
    width: data.width,
    videoId: data.videoId,
    playerVars: {
      startSeconds: data.start,
      autoplay: 1,
      controls: 0,
      enablejsapi: 1,
      modestbranding: 1,
      rel: 0,
      theme: 'light'
    },
    events: {
      'onReady': function(event) {
        //console.log('youTubePlayer.onReady', event);
        event.target.loadVideoById({'videoId': data.videoId, 'startSeconds': data.start});
      },
      'onStateChange': function(event) {
        //console.log('youTubePlayer.onStateChange', event);
        Meteor.call('playing_state', {
          room_id: Session.get('room_id'),
          start: event.target.getCurrentTime()
        });
      }
    }
  });
};

Template.player.play = function() {
  var playing = Queues.playing(Session.get('room_id'));
  console.log('player.play', playing);
  if (!playing) {
    return;
  }
  // data for player layout
  var data = {
    width: Math.min($('#room_player_area').width(), $(window).width()),
    url: playing.url,
    start: Math.round(_.has(playing, 'start') ? playing.start : 1)
  };
  data.height = Math.round(data.width * 3 / 4);
  // position player
  var offset = $("#room_player_area").css({
    height: data.height,
  });
  var offset = $("#room_player_area").offset();
  $('#player').css({
    position: 'absolute',
    left: offset.left,
    top: offset.top
  });
  console.log('playing.play: data', data);
  if (playing.url.indexOf('youtube.com')) {
    Template.player.playYouTube(data);
    Template.player.playYouTubeApi(data);
    return;
  }

};
Template.player.pause = function() {
  if ($('#player_area').data('type') == 'youtube') {
    if (_.has(Template.player.youTubePlayer, 'getPlayerState') && Template.player.youTubePlayer.getPlayerState() == 1) {
      Template.player.youTubePlayer.pauseVideo();
    }
  }
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
