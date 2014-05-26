
define(['we','ember'], function (we) {

  App.WeAvatarComponent = Ember.Component.extend({
    avatarUrl: '/imgs/avatars/user-avatar.png',
    defaultAvatarUrl: '/imgs/avatars/user-avatar.png',
    attributeBindings: ['userId'],
    userId: null,
    init: function(){
      this._super();
      var self = this;

      self.changeAvatarUrl();

      // refresh avatar on user avatar change
      we.events.on('userAvatarChange',function(event, data){
        if(data.user.id === self.userId){
          self.changeAvatarUrl();
        }
      });

    },
    changeAvatarUrl: function() {
      var userId = this.get('userId');
      if(userId){
        // get current time to set as refresh query param
        var refreshTime = new Date().getTime();
        this.set('avatarUrl', '/avatar/' + userId + '?r=' + refreshTime);
      }else{
        this.set('avatarUrl', this.get('defaultAvatarUrl'));
      }
    }
  });

});