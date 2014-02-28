Channel = new Meteor.Collection('channels');



Meteor.methods({
  refreshChannels: function(data) {
    console.log("refreshChannels");
    console.log(data)
    check(data, Object);
    check(data, Match.ObjectIncluding({items: Array}));
		Channel.remove();
    var channel = {};
    _.each(data.items, function(item) {
      channel = {
        _id: item.snippet.channelId,
        title: item.snippet.channelTitle,
        desc: item.snippet.description,
        url: item.snippet.thumbnails.default.url
      };
      if (!_.isString(channel.title) || channel.title.length < 3) {
        return;
      }
      Channel.remove({_id: channel._id});
      Channel.insert(channel);
    });
    return 'saved ' + data.items.length;
  }
});




