Queues = new Meteor.Collection('queues');

Queues.isPlaying = function(queue) { return (_.isObject(queue) && _.has(queue, 'ord') && queue.ord == 0); }
Queues.isInQueue = function(queue) { return (_.isObject(queue) && _.has(queue, 'ord') && queue.ord > 0); }
Queues.isInHistory = function(queue) { return (_.isObject(queue) && _.has(queue, 'ord') && queue.ord < 0); }
Queues.playing = function(room_id) {
  return Queues.findOne(
    {room_id: room_id, ord: 0}
  );
};
Queues.queue = function(room_id) {
  return Queues.find(
    {room_id: room_id, ord: { $gt: 0 }},
    {limit: 100, sort: {ord: 1}}
  );
};
Queues.history = function(room_id) {
  return Queues.find(
    {room_id: room_id, ord: { $lt: 0 }},
    {limit: 100, sort: {played: 1}}
  );
};
Queues.queueMax = function(room_id) {
  var max = Queues.find(
    {room_id: room_id, ord: { $gt: 0 }},
    {limit: 1, sort: {ord: -1}}
  );
  if (max.count() == 0) {
    // nothing in queue playable
    return 0;
  }
  console.log('queueMax', max);
  return max;
};

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
      console.log(Queues.queueMax(data.room_id));
      //data.ord = 1 + Queues.queueMax(data.room_id);
      data.ord = 9;
      data.track = track;
      data.created = moment().format();
      data.creator = Meteor.userId();
      return Queues.insert(data);
    },
    queue_add_track: function(data) {
      console.log('queue_add_track - init', data);
      check(data, Match.ObjectIncluding({room_id: String, type: String}));
      if (data.type == 'yt') {
        // youtube
        check(data, Match.ObjectIncluding({url: String}));
      } else {
        // cdg
        check(data, Match.ObjectIncluding({artist: String, title: String, url_mp3: String, url_cdg: String}));
      }
      data.created = moment().format();
      data.creator = Meteor.userId();
      console.log('queue_add_track - before Tracks.addTrack', data);
      data.track_id = Tracks.addTrack(data);
      console.log('queue_add_track - after Tracks.addTrack', data);
      if (!_.isString(data.track_id)) {
        throw new Meteor.Error(500, 'Can not create Track ' + data.url);
      }
      var track = Tracks.findOne(data.track_id);
      console.log('queue_add_track - track', track);
      if (!_.isObject(track)) {
        throw new Meteor.Error(500, 'Can not find new Track ' + data.track_id);
      }
      data.track = track;
      data.created = moment().format();
      data.creator = Meteor.userId();
      console.log('queue_add_track - insert', data);
      id = Queues.insert(data);
      console.log('queue_add_track - inserted', id);
      return id;
    },
    queue_up: function(data) {
      check(data, Match.ObjectIncluding({room_id: String, queue_id: String}));
      var queue = Queues.findOne(data.queue_id);
      if (!_.isObject(queue)) {
        throw new Meteor.Error(500, 'Can not find new Queue to move up ' + data.queue_id);
      }
      if (Queue.isPlaying(queue)) {
        return 'already playing';
      }
      // move everything "playable" down 1
      Queues.update({room_id: data.room_id, ord: { $gt: current }}, { $inc: { ord: 1 }}, { multi: true });

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
      if (playing) {
        Queues.update({_id: playing._id}, { $set: {status: 'playing', start: 0}});
      }
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


