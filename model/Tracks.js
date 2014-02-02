Tracks = new Meteor.Collection('tracks');

if (Meteor.isClient) {
  Tracks.addTrack = function(data) {
    return Meteor.call('track_add', data);
  };
}


if (Meteor.isServer) {
  Meteor.methods({
    track_add: function(data) {
    check(data, Match.ObjectIncluding({url: String}));
      Tracks.addTrack(data);
    }
  });

  /**
   * Add a track, based on a URL
   *
   */
  Tracks.addTrack = function(data) {
    check(data, Match.ObjectIncluding({url: String}));
    data.url = Tracks.cleanUrl(data.url);
    check(data, Match.ObjectIncluding({url: String}));
    // ensure there isn't a track with this url
    if (Rooms.find({url: data.url}).count() > 0) {
      throw new Meteor.Error(500, 'Can not create Track... it already exists: ' + data.url);
    }
    data = _.omit(data, 'room_id');
    data.created = moment().format();
    data.creator = Meteor.userId();
    return Tracks.insert(data);
  }

  /**
   * Clean any source URL to a standard "embed" url
   * always start with either "//$domain/" or "/"
   *
   * @param string url
   * @return string url
   */
  Tracks.cleanUrl = function(url) {
    console.log('Tracks.cleanUrl-a', url);
    if (!_.isString(url)) {
      return false;
    }
    if (url.indexOf('youtu.be') != -1 || url.indexOf('youtube.com') != -1) {
      return Tracks.cleanUrlYouTube(url);
    }
    // TODO: vimo
    // TODO: ??
    // TODO: local
    return url
  };

  /**
   * parse the URL for an embed
   * <iframe width="420" height="315" src="//www.youtube.com/embed/dSVovg06NQg" frameborder="0" allowfullscreen></iframe>
   *
   */
  Tracks.cleanUrlYouTube = function(url) {
    var id = Tracks.getIdYouTube(url);
    if (id.length < 1) {
      return false;
    }
    return '//www.youtube.com/embed/' + id;
  }



}


/**
 * Get the ID from youtube URLs
 *
 */
Tracks.getIdYouTube = function(url){
  var ID = '';
  url = url.replace(/(>|<)/gi,'').split(/(vi\/|v=|\/v\/|youtu\.be\/|\/embed\/)/);
  if(url[2] !== undefined) {
    ID = url[2].split(/[^0-9a-z_]/i);
    ID = ID[0];
  } else {
    ID = url;
  }
  return ID;
}

/**
 * Determine the thunmbnail for any track data
 *   (this assumes all data.url has already been standardized)
 *   - if data.thumb_url exists, return it
 *   - if youtube, generate the url
 *   ...
 *   - (todo) if local public/tracks/$file.cdg ... ?
 *   - return placeholder url
 *
 */
Tracks.thumbnail = function(data) {
  if (_.has(data, 'thumb_url')) {
    return data.thumb_url;
  }
  if (!_.has(data, 'url')) {
    return '/img/bad-url-track.png';
  }
  if (data.url.indexOf('youtube') > -1) {
    id = Tracks.getIdYouTube(data.url);
    return 'http://img.youtube.com/vi/' + id + '/1.jpg';
  }
  // ...
  // return placeholder, generic icon
  return '/img/karaoke-icon-sm.png';
}

