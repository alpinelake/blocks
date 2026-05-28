function walk(matrix, fn) {
  let result = true;
  for (let y = 0; y < matrix.length; y++) {
    for (let x = 0; x < matrix[0].length; x++) {
      result = fn(y, x);
      if (result === false) break;
    }
    if (result === false) break;
  }
}

function rotateBlocks(blocks, direction = 0) {
  if (direction == 1) {
    return blocks[0].map((val, index) => blocks.map(row => row[index]).reverse());
  } else if (direction == -1) {
    return blocks[0].map((val, index) => blocks.map(row => row[row.length-1-index]));
  } else {
    return blocks;
  }
}

function createBlocks(type) {
  let blocks;
  switch (type) {
    case "I":
      blocks = [
        [0,0,0,0],
        [1,1,1,1],
        [0,0,0,0],
        [0,0,0,0]
      ];
      break;
    case "O":
      blocks = [
        [1,1],
        [1,1]
      ];
      break;
    case "T":
      blocks = [
        [0,1,0],
        [1,1,1],
        [0,0,0]
      ];
      break;
    case "J":
      blocks = [
        [1,0,0],
        [1,1,1],
        [0,0,0]
      ];
      break;
    case "L":
      blocks = [
        [0,0,1],
        [1,1,1],
        [0,0,0]
      ];
      break;
    case "S":
      blocks = [
        [0,1,1],
        [1,1,0],
        [0,0,0]
      ];
      break;
    case "Z":
      blocks = [
        [1,1,0],
        [0,1,1],
        [0,0,0]
      ];
      break;
  }
  return blocks;
}

const GameStatusType = {
  Unstarted: 'unstarted',
  Started: 'started',
  Paused: 'paused',
  Gameover: 'gameover' 
};

function init(onGameStateChange) {
  const ShapeTypes = ["I", "O", "T", "J", "L", "S", "Z"];
  const RTestKey = [0,1,2,-1];
  const RTest = {
     "0,1": [[0,0],[-1,0],[-1, 1],[0,-2],[-1,-2]],
     "1,0": [[0,0],[ 1,0],[ 1,-1],[0, 2],[ 1, 2]],
     "1,2": [[0,0],[ 1,0],[ 1,-1],[0, 2],[ 1, 2]],
     "2,1": [[0,0],[-1,0],[-1, 1],[0,-2],[-1,-2]],
    "2,-1": [[0,0],[ 1,0],[ 1, 1],[0,-2],[ 1,-2]],
    "-1,2": [[0,0],[-1,0],[-1,-1],[0, 2],[-1, 2]],
    "-1,0": [[0,0],[-1,0],[-1,-1],[0, 2],[-1, 2]],
    "0,-1": [[0,0],[ 1,0],[ 1, 1],[0,-2],[ 1,-2]]
  };
  const RTestI = {
     "0,1": [[0,0],[-2,0],[ 1, 0],[-2,-1],[ 1, 2]],
     "1,0": [[0,0],[ 2,0],[-1, 0],[ 2, 1],[-1,-2]],
     "1,2": [[0,0],[-1,0],[ 2, 0],[-1, 2],[ 2,-1]],
     "2,1": [[0,0],[ 1,0],[-2, 0],[ 1,-2],[-2, 1]],
    "2,-1": [[0,0],[ 2,0],[-1, 0],[ 2, 1],[-1,-2]],
    "-1,2": [[0,0],[-2,0],[ 1, 0],[-2,-1],[ 1, 2]],
    "-1,0": [[0,0],[ 1,0],[-2, 0],[ 1,-2],[-2, 1]],
    "0,-1": [[0,0],[-1,0],[ 2, 0],[-1, 2],[ 2,-1]]
  };
  const start_speed = 400;
  const lines = 20;
  const cols = 10;
  const lock_delay = 100;
  const rotate_delay = 100;
  const gravity = 1;
  let shift_delay = start_speed;
  let shapeId = 1;
  let active = null;
  let falling = false;
  let valid_rotation = false;
  let queued_pieces = [];
  let gameStatus = GameStatusType.Unstarted;
  const score = { score: 0, lines: 0, level: 1 };
  onGameStateChange(gameStatus, score);

  const board = Array.from({length:lines}, () => Array.from({length:cols}, () => 0));

  function setupInitialState() {
    let setup1 = [
                                         [15,6],[15,7],
                    [16,3],[16,4],[16,5],[16,6],[16,7],[16,8],[16,9],
             [17,2],[17,3],[17,4],[17,5],             ,[17,8],[17,9],
      [18,1],[18,2],[18,3],[18,4],[18,5],[18,6],      ,[18,8],[18,9],
      [19,1],[19,2],[19,3],[19,4],[19,5],[19,6],[19,7],[19,8],[19,9]
    ];
    let setup2 = [
                                                [15,6],[15,7],
      [16,0],[16,1],       [16,3],[16,4],[16,5],[16,6],[16,7],[16,8],[16,9],
             [17,1],[17,2],[17,3],[17,4],[17,5],[17,6],[17,7],[17,8],[17,9],
      [18,0],[18,1],       [18,3],[18,4],[18,5],[18,6],[18,7],[18,8],[18,9],
             [19,1],[19,2],[19,3],[19,4],[19,5],[19,6],[19,7],[19,8],[19,9]
    ];
    setup2.forEach(([y,x]) => {
      board[y][x] = {
        blocks: [[1]],
        type: "O",
        coord: { y, x }
      };
    });
    //queued_pieces = ["J","L"];
    queued_pieces = ["I","I"];
  }
  //setupInitialState();

  function printBoard() {
    let output = '';
    walk(board, (y, x) => {
      if (x % lines == 0) {
        output += `\ny=${String(y).padStart(2)}| `;
      }
      output += board[y][x].type || " ";
    });
    console.log(output);
  }

  walk(board, (y, x) => {
    const coord = document.createElement('div');
    coord.className = "coord";
    coord.dataset.coord = `${x},${y}`;
    grid.append(coord);
  });
  grid.style.setProperty('--lines', lines);
  grid.style.setProperty('--cols', cols);

  render();

  function render() {
    walk(board, (y, x) => {
      const node = grid.childNodes[cols*y+x];
      const type = board[y][x].type;
      if (type) {
        node.classList.add(type);
      } else {
        node.className = "coord";
      }
      node.classList.toggle('on', !!type);
    });
    if (score != undefined) {
      scoreBug.innerText = score.score;
    }
  }

  function resetBoard() {
    shift_delay = start_speed;
    active = null;
    score.score = 0;
    score.lines = 0;
    score.level = 1;
    walk(board, (y, x) => board[y][x] = 0);
    render();
  }

  function resolve() {
    let result = false;
    let cleared = 0;
    for (let y = board.length-1; y > 0; y--) {
      const ypieces = board[y].filter(bb => bb);
      if (ypieces.length == 0) {
        break; // short circuit
      }
      if (ypieces.length == board[y].length) {
        result = true;
        cleared += 1;
        for (let x = 0; x < board[0].length; x++) {
          // Clear completed line
          board[y][x] = 0;
          // Drop the lines above by one
          for (let j = y; j > 1; j--) {
            board[j][x] = board[j-1][x];
          }
        }
        // Recheck the y line in case more than one line was cleared at once
        y += 1;
      }
    }
    if (cleared == 1) score.score += 100 * score.level;
    if (cleared == 2) score.score += 300 * score.level;
    if (cleared == 3) score.score += 500 * score.level;
    if (cleared == 4) score.score += 800 * score.level;
    score.lines += cleared;
    if (score.lines >= score.level * 10) {
      score.level = Math.min(score.level+1, 15);
      if (score.level <= 7) {
        shift_delay = 400 - (50 * (score.level-1)); // adjust speed
      }
    }
    return result;
  }

  function test(shape, blocks, coordset, vertical = 0, horizontal = 0) {
    let valid = true;
    walk(blocks, (y, x) => {
      const by = shape.coord.y+y;
      const bx = shape.coord.x+x;
      if (blocks[y][x] == 1) {
        const dx = bx+horizontal;
        const dy = by+vertical;
        const outofboundsY = dy > lines-1;
        const outofboundsX = dx < 0 || dx > cols-1;
        const occupied = !outofboundsX && !outofboundsY && dy >= 0 ? board[dy][dx] : null;
        const key = dy * board[0].length + dx;
        const inner = coordset.has(key);
        if (outofboundsY || outofboundsX || (occupied && !inner)) {
          valid = false;
          return false;
        }
      }
    });
    return valid;
  }

  function shift_segment(segment) {
    let coordset = new Set();
    for (let i=0; i < segment.length; i++) {
      const [bx, by, shape] = segment[i];
      const key = by * board[0].length + bx;
      coordset.add(key);
    }
    let valid = true;
    let vertical = 1;
    let horizontal = 0;
    for (let i=0; i < segment.length; i++) {
      const [bx, by, shape] = segment[i];
      const dx = bx+horizontal;
      const dy = by+vertical;
      const key = dy * board[0].length + dx;
      const outofboundsY = dy > lines-1;
      const outofboundsX = dx < 0 || dx > cols-1;
      const occupied = !outofboundsX && !outofboundsY && dy >= 0 ? board[dy][dx] : null;
      const inner = coordset.has(key);
      if (outofboundsY || outofboundsX || (occupied && !inner)) {
        valid = false;
        break;
      }
    }
    if (valid) {
      for (let i=0; i < segment.length; i++) {
        const [bx, by, shape] = segment[i];
        board[by][bx] = 0;
      }
      for (let i=0; i < segment.length; i++) {
        const [bx, by, shape] = segment[i];
        const dx = bx+horizontal;
        const dy = by+vertical;
        board[dy][dx] = shape;
        segment[i][0] = dx;
        segment[i][1] = dy;
      }
    }
    return valid;
  }

  function shift(shape, vertical = 0, horizontal = 0, rotate = 0) {
    let coordset = new Set();
    walk(shape.blocks, (y, x) => {
      if (shape.blocks[y][x] == 1) {
        const by = shape.coord.y+y;
        const bx = shape.coord.x+x;
        const key = by * board[0].length + bx;
        coordset.add(key);
      }
    });

    let valid = true;
    let blocks;

    if (rotate) {
      const currentR = RTestKey[shape.rotated % RTestKey.length];
      blocks = rotateBlocks(shape.blocks, rotate);
      shape.rotated += Math.abs(rotate);
      const appliedR = RTestKey[shape.rotated % RTestKey.length];
      const key = `${currentR},${appliedR}`;
      let candidates = [];
      if (shape.type == "O") {
        return true; // no-op
      } else {
        candidates = shape.type == "I" ? RTestI[key] : RTest[key];
      }
      for (let i=0; i < candidates.length; i++) {
        const [h,v] = candidates[i];
        valid = test(shape, blocks, coordset, v, h);
        if (valid) {
          horizontal = h;
          vertical = v;
          valid_rotation = true;
          break;
        }
      }
    } else {
      blocks = shape.blocks;
      valid = test(shape, blocks, coordset, vertical, horizontal);
    }

    if (valid) {
      walk(shape.blocks, (y, x) => {
        // zero old blocks
        const by = shape.coord.y+y;
        const bx = shape.coord.x+x;
        if (shape.blocks[y][x] == 1 && by >= 0) {
          board[by][bx] = 0;
        }
      });
      walk(blocks, (y, x) => {
        // set new blocks
        const by = shape.coord.y+y+vertical;
        const bx = shape.coord.x+x+horizontal;
        if (blocks[y][x] == 1 && by >= 0) {
          board[by][bx] = shape;
        }
      });
      active.blocks = blocks;
      active.coord.y = shape.coord.y + vertical;
      active.coord.x = shape.coord.x + horizontal;
    } else if (vertical) {
      //active = null; // stops the piece
    } else {
      valid = true; // no-op
    }
    return valid;
  }

  function createPiece(overrideType, y) {
    const type = overrideType || ShapeTypes[Math.floor(Math.random() * ShapeTypes.length)];
    const blocks = createBlocks(type);
    const coord = {
      x: Math.floor(Math.random() * (cols-blocks[0].length)),
      y
    };
    const result = { id: shapeId++, type, blocks, coord, rotated: 0 };
    return result;
  }

  function flood_fill(x, y, segments, si, queue, visited) {
    const key = y * board[0].length + x;
    if (visited.has(key)) return;
    visited.add(key);

    if (board[y][x]) {
      const u = y > 0 ? [y-1, x] : null;
      const d = y < board.length-1 ? [y+1, x] : null;
      const l = x > 0 ? [y, x-1] : null;
      const r = x < board[0].length-1 ? [y, x+1] : null;
      const adjacent = [u,d,l,r].filter(x => x);

      adjacent.forEach(([y1,x1]) => {
        const key1 = y1 * board[0].length + x1;
        if (board[y1][x1] && !visited.has(key1)) {
          queue.push([x1,y1]);
        }
      });

      if (si == null) {
        let seg = [];
        segments.push(seg);
        si = segments.length - 1;
      }
      segments[si].push([x,y,board[y][x]]);

      let coord = queue.shift(0);
      while (coord) {
        const [x1,y1] = coord;
        flood_fill(x1, y1, segments, si, queue, visited);
        coord = queue.shift(0);
      }
    }

    // find next area
    for (let y2 = y; y2 < board.length; y2++) {
      for (let x2 = x; x2 < board[0].length; x2++) {
        const key1 = y2 * board[0].length + x2;
        if (!visited.has(key1)) {
          if (board[y2][x2]) {
            flood_fill(x2, y2, segments, null, queue, visited);
          }
        } else {
          visited.add(key1);
        }
      }
    }
  }

  function start(reset) {
    if (reset) {
      resetBoard();
    }
    if (gameStatus == GameStatusType.Started) {
      return;
    }
    gameStatus = GameStatusType.Started; 
    falling = true;
    let t0;
    let d0;
    let queued_resolve = false;
    let lock_piece = false;

    requestAnimationFrame(loop);

    onGameStateChange(gameStatus, score);

    function loop(t1) {
      if (t0 === undefined) t0 = t1;
      if (d0 === undefined && valid_rotation) d0 = t1;

      if (queued_resolve) {
        queued_resolve = false;
        let line_cleared = resolve();
        if (line_cleared && gravity) {
          const segments = [];
          const visited = new Set();
          const queue = [];
          // exclude active piece from segments so it can fall at the same time
          if (active) {
            walk(active.blocks, (y, x) => {
              if (active.blocks[y][x] == 1) {
                const by = active.coord.y+y;
                const bx = active.coord.x+x;
                const key = by * board[0].length + bx;
                visited.add(key);
              }
            });
          }
          flood_fill(0, 0, segments, null, queue, visited);
          segments.forEach((segment, i) => {
            let shifted = true;
            while (shifted) {
              shifted = shift_segment(segment);
            }
          });
          queued_resolve = true;
          render();
        }
      }
      if (!active) {
        let y = -2; // start off screen
        active = createPiece(queued_pieces.shift(0), y);
        falling = shift(active, 1);
        if (!falling) {
          console.log('halt');
          gameStatus = GameStatusType.Gameover;
          onGameStateChange(gameStatus, score);
        }
        render();
      }

      if (valid_rotation) {
        // spin until rotate delay is reached
        if (t1-d0 > rotate_delay) {
          valid_rotation = false;
          d0 = undefined;
        }
      } else if (falling && t1-t0 > shift_delay) {
        // shift the falling piece one line, after shift delay
        falling = shift(active, 1);
        if (!falling) {
          lock_piece = true;
        }
        t0 = t1;
        render();
      } if (!falling && lock_piece && t1-t0 > lock_delay) {
        // lock the piece in place, after lock delay
        // unless piece can fall again, if shifted right before lock delay
        falling = shift(active, 1);
        if (!falling) {
          active = null;
          t0 = t1;
          lock_piece = false;
          queued_resolve = true;
        }
      }

      if (gameStatus == GameStatusType.Started) { 
        requestAnimationFrame(loop);
      }
    }
  }

  function pause() {
    falling = !falling;
  }

  function stop() {
    if (gameStatus != GameStatusType.Gameover) {
      gameStatus = GameStatusType.Paused; 
      onGameStateChange(gameStatus, score);
    }
  }

  function space(e) {
    let shifted = true;
    let vertical = 1;
    while (active && shifted) {
      shifted = shift(active, vertical);
    }
  }

  function arrow(e) {
    let direction;
    switch (e.key) {
      case "ArrowLeft":
        direction = "left";
        break;
      case "ArrowRight":
        direction = "right";
        break;
      case "ArrowUp":
        direction = "up";
        break;
      case "ArrowDown":
        direction = "down";
        break;
    }
    if (direction) {
      shiftPiece(direction);
    }
  }

  function shiftPiece(direction) {
    if (!active) return;
    let vertical = 0;
    let horizontal = 0;
    let rotate = 0;
    switch (direction) {
      case "left":
        horizontal -= 1;
        break;
      case "right":
        horizontal += 1;
        break;
      case "up":
        rotate += 1; // rotate 90 degrees clockwise
        break;
      case "down":
        vertical += 1;
        //rotate -= 1;
        break;
    }
    shift(active, vertical, horizontal, rotate);
    render();
  }

  return { start, stop, arrow, space, shiftPiece };
}
