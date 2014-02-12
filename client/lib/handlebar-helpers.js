// Session helpers
//
// {{#if sessionEquals 'foo' 'bar'}}  //where foo is session key containing a value and bar is test value
// {{getSession 'foo'}} //returns session keys value
//
//
(function () {
  if (typeof Handlebars !== 'undefined') {

    // ---------------------------------
    // -- App Data
    // ---------------------------------

    Handlebars.registerHelper('isMe', function (userId) {
      if (_.isObject(userId) && _.has(userId, '_id')) {
        userId = userId._id;
      }
      if (!_.isString(userId)) {
        userId = Meteor.userId();
      }
      if (!_.isString(userId) || String(userId).length < 5) {
        return false;
      }
      return userId == Meteor.userId();
    });

    Handlebars.registerHelper('isDJ', function (userId, roomId) {
      return Rooms.isDJ(userId, roomId);
    });

    Handlebars.registerHelper('trackThumbnail', function (track) {
      if (!_.isObject(track) || !_.has(track, 'url')) {
        return new Handlebars.SafeString('<img src="/img/karaoke-icon-sm.png" width="80" alt="no thumb">');
      }
      var thumb_url = Tracks.thumbnail(track);
      var alt = track.url;
      return new Handlebars.SafeString('<img src="' + thumb_url + '" width="80" alt="' + alt + '">');
    });

    // ---------------------------------
    // -- general
    // ---------------------------------

    Handlebars.registerHelper('niceTimestamp', function (timestamp) {
      return moment(timestamp).format('MMMM Do YYYY, h:mm:ss a');
    });

    Handlebars.registerHelper('niceDate', function (timestamp) {
      return moment(timestamp).format('MMMM Do YYYY');
    });

    Handlebars.registerHelper('getSession', function (key) {
      return Session.get(key);
    });

    Handlebars.registerHelper('sessionEquals', function (key, value) {
      var myValue = Session.get(key); //Workaround Issue #617
      if (typeof(myValue) === 'boolean') {
        //Workaround Issue #617
        return Session.equals(key, (value == 'true'));
      }
      return Session.equals(key, (myValue === +myValue)?+value:value); //Workaround Issue #617
      //return Session.equals(key, value); //When Issue #617 is resolved
    });

    Handlebars.registerHelper('findOne', function (collection, query, options) {
      //console.log('findOne: '+collection + '  '+query);
      var myCollection = eval(collection);
      if (myCollection instanceof Meteor.Collection) {
        var myQuery = JSON.parse(query);
        var myOptions = (options instanceof Object)?undefined: JSON.parse(options);
        //console.log(myCollection.findOne(myQuery));
        if (myQuery instanceof Object) {
          return myCollection.findOne(myQuery, myOptions);
        }
        console.log('{{findOne}} query error: '+query);
        throw new Error('Handlebar helper findOne: "'+collection+'" error in query:'+query+' (remember {"_id":1})');
      } else {
        throw new Error('Handlebar helper findOne: "'+collection+'" not found');
      }
      return [];
    });

    Handlebars.registerHelper('find', function (collection, query, options) {
      //console.log('find: '+collection + '  '+query+'  '+(options instanceof Object));
      var myCollection = eval(collection);
      if (myCollection instanceof Meteor.Collection) {
        var myQuery = JSON.parse(query);
        var myOptions = (options instanceof Object)?undefined: JSON.parse(options);
        //console.log(myCollection.find(myQuery));
        if (myQuery instanceof Object) {
          return myCollection.find(myQuery, myOptions);
        }
        console.log('{{find}} query error: '+query);
        throw new Error('Handlebar helper find: "'+collection+'" error in query:'+query+' (remember {"_id":1})');
      } else {
        throw new Error('Handlebar helper find: "'+collection+'" not found');
      }
      return [];
    });

    Handlebars.registerHelper("foreach",function(arr,options) {
      if (options.inverse && !arr.length) {
        return options.inverse(this);
      }
      return arr.map(function(item,index) {
        item.$index = index;
        item.$first = index === 0;
        item.$last  = index === arr.length-1;
        return options.fn(item);
      }).join('');
    });
  }
}());
