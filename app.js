Router.configure({
  layoutTemplate: 'layout'
});

Router.map(function () {
  /**
   * The route's name is "home"
   * The route's template is also "home"
   * The default action will render the home template
   */
  this.route('home', {
    path: '/',
    template: 'home'
  });

  /**
   * Lost of Rooms, Create new Room
   */
  this.route('rooms', {
    path: '/rooms',
    // before hooks are run before your action
    before: [
      function () {
        this.subscribe('rooms');
      },
      function () {
        // we're done waiting on all subs
        if (this.ready()) {
          NProgress.done();
        } else {
          NProgress.start();
          this.stop(); // stop downstream funcs from running
        }
      }
    ],
    action: function () {
      var params = this.params; // including query params
      var hash = this.hash;
      var isFirstRun = this.isFirstRun;
      this.render(); // render all
      if (_.has(params, 'hash') && params.hash == 'create') {
        this.render('rooms_create_form', {to: 'rooms_create_yield'});
      } else {
        this.render('rooms_create_prompt', {to: 'rooms_create_yield'});
      }
    },
    data: function() {
      return {
        rooms: Rooms.find()
      }
    }
  });

  /**
   * Room selected - Main Interface
   */
  this.route('room', {
    path: '/room/:_id',
    load: function () {
      // called on first load
      Session.set('room_id', this.params._id);
      Meteor.call('room_enter', this.params._id);
    },
    unload: function () {
      // before a new route is run
      Session.set('room_id', null);
      Meteor.call('room_leave', this.params._id);
    },
    // before hooks are run before your action
    before: [
      function () {
        Session.set('isHost', false);
        Session.set('room_id', this.params._id);
        this.subscribe('room', this.params._id).wait();
        this.subscribe('tracks');
        this.subscribe('channels');
      },
      function () {
        // we're done waiting on all subs
        if (this.ready()) {
          NProgress.done();
        } else {
          NProgress.start();
          this.stop(); // stop downstream funcs from running
        }
      }
    ],
    action: function () {
      var params = this.params; // including query params
      var hash = this.hash;
      var isFirstRun = this.isFirstRun;
      this.render(); // render all
      if (_.has(params, 'hash') && _.isString(params.hash) && params.hash.length) {
        hash = params.hash;
      }
      Session.set('hash', hash);
      switch(hash) {
        // quick actions
        case 'toggle-host':
          Template.player.size();
          window.location.hash = 'player';
          break;
        // switch yield
        case 'queue':
          this.render('room_queue', {to: 'room_yield'});
          break;
        case 'queue_add':
          this.render('room_queue_add', {to: 'room_yield'});
          break;
        case 'queue_add_track':
          this.render('room_queue_add_track', {to: 'room_yield'});
          break;
        case 'history':
          this.render('room_history', {to: 'room_yield'});
          break;
        case 'users':
          this.render('room_users', {to: 'room_yield'});
          break;
        default:
          this.render('room_player', {to: 'room_yield'});
      }
    },
    after: function() {
      var params = this.params; // including query params
      var hash = this.hash;
      if (_.has(params, 'hash') && _.isString(params.hash) && params.hash.length) {
        hash = params.hash;
      }
      // switch active tab
      var tabA = $('a[href="#' + hash + '"]');
      if (tabA.length > 0) {
        tabA.closest('ul').find('.active').removeClass('active');
        tabA.closest('li').addClass('active');
      } else {
        Meteor.setTimeout(function() {
          var tabA = $('a[href="#' + hash + '"]');
          tabA.closest('ul').find('.active').removeClass('active');
          tabA.closest('li').addClass('active');
        }, 500);
      }
    },
    data: function() {
      return {
        room: Rooms.findOne({_id: this.params._id}),
        playing: Queues.playing(this.params._id),
        next: Queues.find({room_id: this.params._id, status: { $nin: [ 'playing', 'paused', 'played' ] }}, {limit: 5, sort: {created: 1}}),
        queue: Queues.queue(this.params._id),
        history: Queues.find({room_id: this.params._id, status: 'played' }, {limit: 100, sort: {created: 1}}),
        channels: Channel.find()
      };
    }
  });

  /**
   * Room Host/Player - Player Interface
   */
  this.route('host', {
    path: '/host/:_id',
    load: function () {
      // called on first load
      Session.set('room_id', this.params._id);
      Meteor.call('host_enter', this.params._id);
    },
    unload: function () {
      // before a new route is run
      Session.set('room_id', null);
      Meteor.call('host_leave', this.params._id);
    },
    // before hooks are run before your action
    before: [
      function () {
        Session.set('isHost', true);;
        Session.set('room_id', this.params._id);
        this.subscribe('room', this.params._id).wait();
        this.subscribe('tracks');
      },
      function () {
        // we're done waiting on all subs
        if (this.ready()) {
          NProgress.done();
        } else {
          NProgress.start();
          this.stop(); // stop downstream funcs from running
        }
      }
    ],
    data: function() {
      return {
        room: Rooms.findOne({_id: this.params._id}),
        playing: Queues.playing(this.params._id),
        next: Queues.find({room_id: this.params._id, status: { $nin: [ 'playing', 'paused', 'played' ] }}, {limit: 5, sort: {created: 1}})
      };
    }
  });
});

