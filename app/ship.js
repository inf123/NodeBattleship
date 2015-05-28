
function Ship(size) {
  this.gridRows = 10;
  this.gridCols = 10;

  this.x = 0;
  this.y = 0;
  this.size = size;
  this.hits = 0;
  this.orientation = 0;
}

Ship.prototype.isSunk = function() {
  return this.hits >= this.size;
}

module.exports = Ship;


