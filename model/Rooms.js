Rooms = new Meteor.Collection('rooms');

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
