/**
 * Cleanup functionality
 * TODO: switch to cron...
 *
 */
Meteor.startup(function() {
  _.each(Rooms.find().fetch(), function(room, i) {
    if (Rooms.isTooOld(room)) {
      console.log('Removing Old Room: ', room._id);
      Rooms.remove(room._id);
    }
  });
});
