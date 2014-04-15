Rooms = new Meteor.Collection('rooms');

if (Meteor.isServer) {
  /**
   * if a room is older than 10 days = purgeable
   */
  Rooms.isTooOld = function(room) {
    return (moment(room.created).diff(moment(), 'days') > 10);
  };



}

/**
 * Is a user a DJ for this room?
 *
 * @return boolean
 */
Rooms.isDJ = function(userId, roomId) {
  // get and vet userId()
  if (_.isUndefined(userId)) {
    userId = Meteor.userId();
  }
  if (_.isObject(userId) && _.has(userId, '_id')) {
    userId = userId._id;
  }
  if (!_.isString(userId)) {
    userId = Meteor.userId();
  }
  if (!_.isString(userId) || String(userId).length < 5) {
    return false;
  }
  // do we know the room?
  if (_.isUndefined(roomId)) {
    roomId = Session.get('room_id');
  }
  if (!_.isString(roomId) || String(roomId).length < 5) {
    return false;
  }
  var room = Rooms.findOne(roomId);
  // is the user a DJ for this room?
  if (_.has(room, 'djs') && _.contains(room.djs, userId)) {
    return true;
  }
  // does this room have a DJ?
  if (_.has(room, 'djs') && room.djs.length > 0) {
    return false;
  }
  // no DJs means everyone is a DJ (party!)
  return true;
};

/**
 * Client --> Server Methods
 * (even though this is defined client & server, it's only actually run on the server)
 */
Meteor.methods({
  rooms_create: function(data) {
    check(data, Match.ObjectIncluding({name: String, desc: String}));
    // room garbage collection
    // ensure there isn't a room with this name
    if (Rooms.find({name: data.name}).count() > 0) {
      throw new Meteor.Error(500, 'Can not create Room... it already exists');
    }
    data.created = moment().format();
    data.creator = Meteor.userId();
    data.users = [];
    return Rooms.insert(data);
  },
  room_enter: function(room_id) {
    return Rooms.update({_id: room_id}, { $push: { users: Meteor.userId() } } );
  },
  room_leave: function(room_id) {
    return Rooms.update({_id: room_id}, { $pull: { users: Meteor.userId() } } );
  }
});

