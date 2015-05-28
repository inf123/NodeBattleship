var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var BattleshipGame = require('./app/game.js');

var port = 8900;

var users = {};
var gameIdCounter = 1;

app.use(express.static(__dirname + '/public'));

http.listen(port, function(){
  console.log('listening on *:' + port);
});

io.on('connection', function(socket) {
  console.log((new Date().toISOString()) + ' ID ' + socket.id + ' connected.');

  // create user object for additional data
  users[socket.id] = {
    inGame: null,
    player: null
  }; 

  // join waiting room until there are enough players to start a new game
  socket.join('waiting room');

  /**
   * Handle chat messages
   */
  socket.on('chat', function(msg) {
    if(users[socket.id].inGame !== null && msg) {
      console.log((new Date().toISOString()) + ' Chat message from ' + socket.id + ': ' + msg);
      
      // Send message to opponent
      socket.broadcast.to('game' + users[socket.id].inGame.getId()).emit('chat', {
        name: 'Opponent',
        message: msg,
      });

      // Send message to self
      io.to(socket.id).emit('chat', {
        name: 'Me',
        message: msg,
      });
    }
  });

  /**
   * Handle shot from client
   */
  socket.on('shot', function(position) {
    var game = users[socket.id].inGame, opponent;

    if(game !== null) {
      // Is it this users turn?
      if(game.getCurrentPlayer() === users[socket.id].player) {
        opponent = game.getCurrentPlayer() === 0 ? 1 : 0;

        if(game.shoot(position)) {
          // shot was valid. Update game state on both clients.
          io.to(socket.id).emit('update', game.getGameState(users[socket.id].player, opponent));
          io.to(game.getPlayerId(opponent)).emit('update', game.getGameState(opponent, opponent));
        }
      }
    }
  });
  
  /**
   * Handle client disconnect
   */
  socket.on('disconnect', function() {
    console.log((new Date().toISOString()) + ' ID ' + socket.id + ' disconnected.');
    
    if(users[socket.id].inGame !== null) {
      // If user is in a game, end it.
      endGame(users[socket.id].inGame);
    }

    delete users[socket.id];
  });

  joinWaitingPlayers();
});

/**
 * Create games for players in waiting room
 */
function joinWaitingPlayers() {
  var players = getClientsInRoom('waiting room');
  
  if(players.length >= 2) {
    // 2 player waiting. Create new game!
    var game = new BattleshipGame(gameIdCounter++, players[0].id, players[1].id);

    // create new room for this game
    players[0].leave('waiting room');
    players[1].leave('waiting room');
    players[0].join('game' + game.getId());
    players[1].join('game' + game.getId());

    users[players[0].id].player = 0;
    users[players[1].id].player = 1;
    users[players[0].id].inGame = game;
    users[players[1].id].inGame = game;
    
    io.to('game' + game.getId()).emit('join', game.getId());

    // send initial ship placements
    io.to(players[0].id).emit('update', game.getGameState(0, 0));
    io.to(players[1].id).emit('update', game.getGameState(1, 1));

    console.log((new Date().toISOString()) + " " + players[0].id + " and " + players[1].id + " has joined game ID " + game.getId());
  }
}

function endGame(game) {
  io.to('game' + game.getId()).emit('gameover', game.getId());
}

/**
 * Find all sockets in a room
 * @param {type} room
 * @returns {Array}
 */
function getClientsInRoom(room) {
  var clients = [];
  for (var id in io.sockets.adapter.rooms[room]) {
    clients.push(io.sockets.adapter.nsp.connected[id]);
  }
  return clients;
}
