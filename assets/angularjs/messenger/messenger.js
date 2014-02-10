/*
 * WE messenger
 *
 * Copyright 2014, Alberto Souza
 *
 * Licensed under the MIT license:
 * http://www.opensource.org/licenses/MIT
 */

(function (factory) {
  'use strict';
  if (typeof define === 'function' && define.amd) {
    // Register as an anonymous AMD module:
    define([
      'jquery',
      'angular',
      '$socket',
      'angular-resource',
      'user/user',
    ], factory);
  } else {
    factory();
  }
}(function () {
  'use strict';

  // --- MODULE ---
  angular.module('messenger', [
    'ngResource','ngRoute', 'ui.router', 'ui.bootstrap'
  ]).
  config([ '$locationProvider','$httpProvider','$stateProvider', '$urlRouterProvider',
    function( $locationProvider, $httpProvider, $stateProvider, $urlRouterProvider) {

    }
  ]);

  // --- CONTROLERS ---
  angular.module("messenger")
  .controller("MessengerCtrl", [
    "$rootScope",
    "$scope",
    "$socket",
    "$location",
    "SessionService",
    "MessengerService",
     function($rootScope, $scope,$socket, $location, SessionService, MessengerService) {
      var init;
      var startMessenger;
      var moduleUrl = '/angularjs/messenger';

      $scope.contacts = {};
      $scope.contactsOpen = [];
      $scope.templates = {};

      $scope.contactList = {};

      init = function() {

        $scope.contactList.show = false;

        $scope.templates.messengerBox = {
          name: 'messenger-box.html',
          url: moduleUrl + '/views/messenger-box.html'
        };
        /*
        $scope.templates.messageFrom = '';
        $scope.templates.messageTo = {
          name: 'messenger-box.html',
          url: '/templates/messenger-box.html'
        };
        */
        //$scope.templates.;

        //$scope.template = $scope.templates[1];

        $scope.contacts = {};

        $scope.user = SessionService.getUser();

        //if($scope.user.authorized){
          startMessenger($scope);
        //}
      };

      /**
       * Get messenger data and start
       * @return {[type]} [description]
       */
      startMessenger = function ($scope){
        MessengerService.start(
          //success
          function(data) {
            angular.forEach(data.friendList, function(contact, key){

              // set default values for every contact
              if(!contact.messages){
                contact.messages = [];
              }
              if(!contact.messengerBox){
                contact.messengerBox = {};
              }

              $scope.contacts[contact.id] = contact;

            });


          },
          // error
          function(data) {
            console.log('Error on startMessegner', data);
          }
        );
        /*
        $socket.get('/messenger/start', function (response) {
          console.log(response);
          console.log('starting messenger socket io');

        });
      */
      }

      $scope.contactList.open = function (){
        $scope.contactList.show = true;
      }

      $scope.contactList.close = function (){
        $scope.contactList.show = false;
      }


      $scope.startTalk = function (contactId){
        $scope.contacts[contactId].messengerBox.show = true;
        $scope.contacts[contactId].messengerBox.opened = true;
      }

      $scope.messengerBoxClose = function(contactId) {
        $scope.contacts[contactId].messengerBox.show = false;
      }

      $scope.messengerBoxToggle = function(contactId) {
        console.log('togle: ',$scope);
        if($scope.contacts[contactId].messengerBox.opened){
          $scope.contacts[contactId].messengerBox.opened = false;
        }else{
          $scope.contacts[contactId].messengerBox.opened = true;
        }
      }

      $scope.messengerAlertNewMessageReceived = function (contactId){
        console.log($scope);
        $scope.startTalk(contactId);
        $scope.$apply();
      }

      $scope.send = function (newMessage, toId, event){
        event.preventDefault();
        event.stopPropagation();

        var user = SessionService.getUser();
        var newMessageObj = {};

        console.log(user);

        newMessageObj.content = newMessage;
        newMessageObj.toId = [ toId ];
        newMessageObj.fromId = user.id;
        newMessageObj.status = 'sending';

        $scope.contacts[toId].messages.push(newMessageObj);
        $scope.contacts[toId].newMessage = '';

        $socket.post(
          '/users/'+toId+'/messenger',
          newMessageObj ,
          function (response) {
            console.log(response);
        });
      }
      /*
      var scope = SessionService;
      if(!scope.user) scope.user = {};
      */
      $rootScope.$watch('user', function(newValue, oldValue) {
        $scope.user = newValue;
      });

      // Socket IO

      /**
       * Receive a messenger message
       * @param  Object data
       */
      $socket.on("receive:message", function(data) {
          var newMessageObj = {};
          var user = SessionService.getUser();

          newMessageObj.content = data.message.content;
          newMessageObj.toId = user.id ;
          newMessageObj.fromId = data.message.fromId;
          newMessageObj.status = 'sending';

          $scope.contacts[data.message.fromId].messages.push(data.message);
          /*
          var objDiv = document.getElementById("messengerBox-" + newMessageObj.fromId);
          objDiv.prop({ scrollTop: $("#chatbox").prop("scrollHeight") });
          */
          console.log($scope);

          $scope.messengerAlertNewMessageReceived(newMessageObj.fromId);
      });

      /**
       * Message receveid after a contact disconect
       * @param  object data
       */
      $socket.on("contact:connect", function(data) {
        var user = SessionService.getUser();
        var contact = data.contact;

        if(user.id != contact.id){
          // set default values for every contact
          if(!contact.messages){
            contact.messages = [];
          }
          if(!contact.messengerBox){
            contact.messengerBox = {};
          }

          $scope.contacts[contact.id] = contact;
          //$scope.contacts[data.contact.id] = ;
          $scope.$apply();
        }
      });

      /**
       * Message receveid after a contact disconect
       * @param  object data
       */
      $socket.on("contact:disconnect", function(data) {
          delete $scope.contacts[data.contact.id];
          $scope.$apply();
      });

      return init();
    }
  ]);

  // --- SERVICES ---
  angular.module('messenger')
  .service("messengerService",["$resource"])
  .factory("MessengerService", [
    "$resource",
    function ($resource) {
    // We need to add an update method
    return $resource("/messenger/:id", { }, {
        'start': {
          method: 'GET',
          url: '/messenger/start'
        }
      }
    );

    // return $resource(
    //    "/messenger/:id", { id: "@id" }, {
    //       index: { method: 'GET', isArray: true },
    //       new: { method: 'GET' },
    //       create: { method: 'POST' },
    //       show: { method: 'GET' },
    //       edit: { method: 'GET' },
    //       update: { method: 'PUT' },
    //       destroy: { method: 'DELETE' }
    //     }
    // );
  }]);

}));