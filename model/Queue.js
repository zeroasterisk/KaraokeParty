Queues = new Meteor.Collection('queues');

Queues.playing = function(room_id) { return Queues.findOne({room_id: room_id, status: { $in: ['playing', 'paused'] }}); }

if (Meteor.isServer) {
  /**
   * Client --> Server Methods
   * (protected only on server)
   */
  Meteor.methods({
    queue_add: function(data) {
      check(data, Match.ObjectIncluding({room_id: String, track_id: String}));
      // queue garbage collection
      // ensure there isn't a room with this name
      var track = Tracks.findOne(data.track_id);
      if (!_.isObject(track)) {
        throw new Meteor.Error(500, 'Can not find Track ' + data.track_id);
      }
      data.track = track;
      data.created = moment().format();
      data.creator = Meteor.userId();
      return Queues.insert(data);
    },
    queue_add_track: function(data) {
      console.log('queue_add_track_url', data);
      check(data, Match.ObjectIncluding({room_id: String, url: String}));
      data.track_id = Tracks.addTrack(data);
      console.log('queue_add_track_url', data);
      if (!_.isString(data.track_id)) {
        throw new Meteor.Error(500, 'Can not create Track ' + data.url);
      }
      var track = Tracks.findOne(data.track_id);
      console.log('queue_add_track_url', track);
      if (!_.isObject(track)) {
        throw new Meteor.Error(500, 'Can not find new Track ' + data.track_id);
      }
      data.track = track;
      data.created = moment().format();
      data.creator = Meteor.userId();
      return Queues.insert(data);
    }
  });
}

/**
 * Client --> Server Methods
 * (even though this is defined client & server, it's only actually run on the server)
 */
Meteor.methods({
  playing_play: function(room_id) {
    console.log('playing_play', room_id);
    var playing = Queues.playing(room_id);
    if (!playing) {
        playing = Queues.findOne({room_id: room_id, status: { $nin: [ 'playing', 'paused', 'played' ] }}, {sort: {created: 1}});
    }
    if (!playing) {
      console.log('nothing to play for room_id : ' + room_id);
      return false;
    }
    Queues.update({_id: playing._id}, { $set: {status: 'playing'}});
    return true;
  },
  playing_pause: function(room_id) {
    console.log('playing_pause', room_id);
    var playing = Queues.playing(room_id);
    if (!playing) {
        playing = Queues.findOne({room_id: room_id, status: { $nin: [ 'playing', 'paused', 'played' ] }}, {sort: {created: 1}});
    }
    if (!playing) {
      console.log('nothing to pause for room_id : ' + room_id);
      return false;
    }
    Queues.update({_id: playing._id}, { $set: {status: 'paused'}});
    return true;
  },
  playing_prev: function(room_id) {
    console.log('playing_prev', room_id);
    var playing = Queues.playing(room_id);
    if (!playing) {
        playing = Queues.findOne({room_id: room_id, status: { $nin: [ 'playing', 'paused', 'played' ] }}, {sort: {created: 1}});
    }
    if (playing) {
      Queues.update({_id: playing._id}, { $set: {status: 'skip-backed', start: 0}});
    }
    // set playing to 1 prev 'played'
    var prev = Queues.findOne({room_id: room_id, status: 'played' }, {sort: {created: 1}});
    if (!prev) {
      console.log('nothing to play for prev for room_id : ' + room_id);
      return false;
    }
    Queues.update({_id: prev._id}, { $set: {status: 'playing', start: 0}});
    return true;
  },
  playing_next: function(room_id) {
    console.log('playing_next', room_id);
    var playing = Queues.playing(room_id);
    if (playing) {
      Queues.update({_id: playing._id}, { $set: {status: 'played', start: 0}});
    }
    // set playing to 1 "next" 'played'
    var next = Queues.findOne({room_id: room_id, status: { $nin: [ 'playing', 'paused', 'played' ] }}, {sort: {created: 1}});
    if (!next) {
      console.log('nothing to play for next for room_id : ' + room_id);
      return false;
    }
    Queues.update({_id: next._id}, { $set: {status: 'playing', start: 0}});
    return true;
  },
  playing_state: function(data) {
    console.log('playing_state', data);
    check(data, Match.ObjectIncluding({room_id: String, start: Number}));
    var playing = Queues.playing(data.room_id);
    if (!playing) {
      return false;
    }
    if (data.start < 2) {
      return false;
    }
    if (_.has(playing, 'start') && Math.abs(playing.start - data.start) < 2) {
      return false;
    }
    // update with currently played time (start in sec)
    Queues.update({_id: playing._id}, { $set: {start: data.start}});
  }
});


