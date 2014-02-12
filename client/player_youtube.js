/**
 * Basic JS code needed for the YouTube player
 * embedded into the Template.player $('#player') / $('#player_area')
 *
 *
 */

// callback, hardcoded, for YouTube, when the JS has loaded
onYouTubeIframeAPIReady = function() {
  console.log('playerYouTube.apiReady');
  playerYouTube.apiSetup = true;
  playerYouTube.apiReady = true;
  Template.player.play();
};

playerYouTube = {
  apiReady: false,
  apiSetup: false,
  monitorId: null,
  playerAPI: null,
  setup: function() {
    if (playerYouTube.apiSetup) {
      return;
    }
    playerYouTube.apiSetup = true;
    var tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
  },

  // setup this video (all DOM interactions)
  playInit: function(data) {
    if (!_.isObject(data) || !_.has(data, 'url')) {
      console.error('playerYouTube.playIniti - bad data', data);
      return;
    }
    data.videoId = Tracks.getIdYouTube(data.url);
    if ($('#player_area').data('videoId') == data.videoId) {
      // video loaded
      console.log('playing.play: video-loaded', data);
      return;
    }
    // load video
    data.yturl = 'http://' + data.url + '?autoplay=0&controls=0&enablejsapi=1&modestbranding=1&rel=0&theme=light&start' + data.start;
    console.log('playing.play: video-load', data);
    $('#player_area')
    .data('type', 'youtube')
    .data('videoId', data.videoId)
    .data('videoApiLoaded', null)
    .data('videoStart', data.start)
    .html(_.template('<iframe id="ytplayer" width="<%= width %>" height="<%= height %>" src="<%= yturl %>" frameborder="0" allowfullscreen></iframe>', data));
    console.log('playing.play: video-load:done', data);

    // setup monitoring on an interval
    if (!_.isNull(this.monitorId)) {
      Meteor.clearInterval(this.monitorId);
    }
    this.monitorId = Meteor.setInterval(playerYouTube.monitor, 1000);
  },

  // trigger YouTube events
  playApi: function(data) {
    if (!this.apiReady) {
      // callback will auto-re-play
      console.log('playerYouTube.playApi: skip');
      return;
    }
    if ($('#player_area').data('videoApiLoaded') == data.videoId) {
      console.log('playerYouTube.playApi: loaded');
      if (_.has(this.playerAPI, 'getPlayerState') && this.playerAPI.getPlayerState() == 1) {
        console.log('playerYouTube.playApi: playing');
        return;
      }
      this.playerAPI.playVideo();
      return;
    }
    // YouTube is ready, but we don't have the player "started" on this object
    console.log('playerYouTube.playApi: load', data, Tracks.getIdYouTube(data.url));
    $('#player_area').data('videoApiLoaded', data.videoId);
    // setup the Object
    this.playerAPI = new YT.Player('ytplayer', {
      height: data.height,
      width: data.width,
      videoId: data.videoId,
      playerVars: {
        startSeconds: data.start,
        autoplay: 0,
        controls: 0,
        enablejsapi: 1,
        modestbranding: 1,
        rel: 0,
        theme: 'light'
      },
      events: {
        'onReady': function(event) {
          //console.log('playerYouTube.onReady', event);
          if (Template.player.autoplay) {
            event.target.loadVideoById({'videoId': data.videoId, 'startSeconds': Template.player.start});
          }
        },
        'onStateChange': function(event) {
          //console.log('playerYouTube.onStateChange', event);
          Template.player.onStateChange({
            state: playerYouTube.getState(event.target),
            start: event.target.getCurrentTime()
          });
        }
      }
    });
  },

  // monitor player (every second)
  monitor: function() {
    if ($('#player_area').data('videoApiLoaded') != $('#player_area').data('videoId')) {
      //console.log('Meteor.setInterval-skipped-videoIdsDoNotMatch');
      return;
    }
    if (!_.has(Template.player, 'playerYouTube')) {
      //console.log('Meteor.setInterval-skipped-missing-playerYouTube');
      return;
    }
    if (this.playerAPI.getPlayerState() != 1) {
      //console.log('Meteor.setInterval-skipped-not-playing');
      return;
    }
    var currentTime = this.playerAPI.getCurrentTime();
    if (Math.abs($('#player_area').data('videoStart') - currentTime) < 2) {
      //console.log('Meteor.setInterval-skipped-start-in-sync');
      return;
    }
    Meteor.call('playing_state', {
      room_id: Session.get('room_id'),
      start: currentTime,
    });
  },

  getState: function(playerAPI) {
    var state = 'unknown';
    switch (playerAPI.getPlayerState()) {
      case -1:
        state = 'unstarted';
      break;
      case 0:
        state = 'ended';
      break;
      case 1:
        state = 'playing';
      break;
      case 2:
        state = 'paused';
      break;
      case 5:
        state = 'cueued';
      break;
    }
    return state;
  },

  pause: function() {
    this.playerAPI.pauseVideo();
    //if (this.getState(this.playerAPI) == 'playing') { }
  }
}
