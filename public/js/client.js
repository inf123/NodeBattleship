var socket = io();

$(function() {
  /**
   * Successfully connected to server event
   */
  socket.on('connect', function() {
    console.log('Connected to server.');
    $('#disconnected').hide();
    $('#waiting-room').show();   
  });

  /**
   * Disconnected from server event
   */
  socket.on('disconnect', function() {
    console.log('Disconnected from server.');
    $('#waiting-room').hide();
    $('#game').hide();
    $('#disconnected').show();
  });

  /**
   * User has joined a game
   */
  socket.on('join', function(gameId) {
    Game.initGame();
    $('#waiting-room').hide();
    $('#game').show();
    $('#game-number').html(gameId);
  })

  /**
   * Update player's game state
   */
  socket.on('update', function(gameState) {
    console.log(gameState);
    Game.setTurn(gameState.turn);
    Game.updateGrid(gameState.gridIndex, gameState.grid);
  });

  /**
   * Game chat message
   */
  socket.on('chat', function(msg) {
    $('#messages').append('<li><strong>' + msg.name + ':</strong> ' + msg.message + '</li>');
    $('#messages-list').scrollTop($('#messages-list')[0].scrollHeight);
  })

  socket.on('gameover', function() {

  });
  
  /**
   * Send chat message to server
   */
  $('#message-form').submit(function() {
    socket.emit('chat', $('#message').val());
    $('#message').val('');
    return false;
  });

});

function sendShot(square) {
  socket.emit('shot', square);
}
