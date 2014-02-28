Meteor.publish("rooms", function () {
  return Rooms.find(); // everything
});

// server: publish all messages for a given room
Meteor.publish("room", function (roomId) {
  check(roomId, String);
  return [
    Rooms.find({_id: roomId}),
    Queues.find({room_id: roomId})
  ];
});

Meteor.publish("tracks", function () {
  // TODO: limit to a subset of tracks
  return Tracks.find(); // everything
});
Meteor.publish("channels", function () {
  return Channel.find(); // everything
});
