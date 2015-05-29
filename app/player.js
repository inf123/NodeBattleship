var Ship = require('./ship.js');
var Settings = require('./settings.js');

/**
 * Player constructor
 * @param {type} id Socket ID
 */
function Player(id) {
  var i;
  
  this.id = id;
  this.shots = Array(Settings.gridRows * Settings.gridCols);
  this.shipGrid = Array(Settings.gridRows * Settings.gridCols);
  this.ships = [];

  for(i = 0; i < Settings.gridRows * Settings.gridCols; i++) {
    this.shots[i] = 0;
    this.shipGrid[i] = -1;
  }

  if(!this.createRandomShips()) {
    // Random placement of ships failed. Use fallback layout (should rarely happen).
    this.ships = [];
    this.createShips();
  }
};

/**
 * Fire shot on grid
 * @param {type} gridIndex
 * @returns {Boolean} True if hit
 */
Player.prototype.shoot = function(gridIndex) {
  if(this.shipGrid[gridIndex] >= 0) {
    // Hit!
    this.ships[this.shipGrid[gridIndex]].hits++;
    this.shots[gridIndex] = 2;
    return true;
  } else {
    // Miss
    this.shots[gridIndex] = 1;
    return false;
  }
};

/**
 * Get an array of sunk ships
 * @returns {undefined}
 */
Player.prototype.getSunkShips = function() {
  var i, sunkShips = [];

  for(i = 0; i < this.ships.length; i++) {
    if(this.ships[i].isSunk()) {
      sunkShips.push(this.ships[i]);
    }
  }

  return sunkShips;
};

/**
 * Create ships and place them randomly in grid
 * @returns {Boolean}
 */
Player.prototype.createRandomShips = function() {
  var shipIndex;
  
  for(shipIndex = 0; shipIndex < Settings.ships.length; shipIndex++) {
    ship = new Ship(Settings.ships[shipIndex]);
  
    if(!this.placeShipRandom(ship, shipIndex)) {
      return false;
    }

    this.ships.push(ship);
  }
  
  return true;
};

/**
 * Try to place a ship randomly in grid without overlapping another ship.
 * @param {Ship} ship
 * @param {Number} shipIndex
 * @returns {Boolean}
 */
Player.prototype.placeShipRandom = function(ship, shipIndex) {
  var i, gridIndex, xMax, yMax;
  // retry 20 times max
  for(i = 0; i < 20; i++) {
    ship.horizontal = Math.random() < 0.5;

    xMax = ship.horizontal ? Settings.gridCols - ship.size + 1 : Settings.gridCols;
    yMax = ship.horizontal ? Settings.gridRows : Settings.gridRows - ship.size + 1;

    ship.x = Math.floor(Math.random() * xMax);
    ship.y = Math.floor(Math.random() * yMax);

    if(!this.checkShipOverlap(ship)) {
      // success - ship does not overlap
      // place ship array-index in shipGrid
      gridIndex = ship.y * Settings.gridCols + ship.x;
      for(i = 0; i < ship.size; i++) {
        this.shipGrid[gridIndex] = shipIndex;
        gridIndex += ship.horizontal ? 1 : Settings.gridCols;
      }
      return true;
    }
  }
  
  return false;
}

/**
 * Check if a ship overlaps another ship in the grid.
 * @param {Ship} ship
 * @returns {Boolean} True if ship overlaps
 */
Player.prototype.checkShipOverlap = function(ship) {
  var i, gridIndex = ship.y * Settings.gridCols + ship.x;

  for(i = 0; i < ship.size; i++) {
    if(this.shipGrid[gridIndex] >= 0) {
      return true;
    }
    gridIndex += ship.horizontal ? 1 : Settings.gridCols;
  }

  return false;
}

/**
 * Create ships and place them in grid
 */
Player.prototype.createShips = function() {
  var shipIndex, i, gridIndex, x = 1, ship;

  for(shipIndex = 0; shipIndex < Settings.ships.length; shipIndex++) {
    ship = new Ship(Settings.ships[shipIndex]);
    ship.horizontal = false;
    ship.x = x;
    ship.y = 2;

    // place ship array-index in shipGrid
    gridIndex = ship.y * Settings.gridCols + ship.x;
    for(i = 0; i < ship.size; i++) {
      this.shipGrid[gridIndex] = shipIndex;
      gridIndex += ship.horizontal ? 1 : Settings.gridCols;
    }

    this.ships.push(ship);

    x += 2;
  }
};

module.exports = Player;