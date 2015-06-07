/* global $ */

$(function () {
  var FPS = 60,
      CANVAS_WIDTH = 600,
      CANVAS_HEIGHT = 450,
      BOUNDARY_MARGIN = 10,
      BOUNDARY_WIDTH = 15,
      PADDLE_WIDTH = 15,
      PADDLE_HEIGHT = 60,
      PADDLE_MOVE_INTERVAL = 6,
      BALL_SIZE = 15,
      MIN_BALL_VELOCITY = 2,
      MAX_BALL_VELOCITY = 8,
      VELOCITY_STEP = 1,
      KEY_CODES = {
        LEFT_UP: 87,
        LEFT_DOWN: 83,
        RIGHT_UP: 38,
        RIGHT_DOWN: 40,
        SPACE: 32
      },  
      FIELD = {
        TOP: BOUNDARY_MARGIN + BOUNDARY_WIDTH,
        BOTTOM: CANVAS_HEIGHT - BOUNDARY_MARGIN - BOUNDARY_WIDTH,
        RIGHT: CANVAS_WIDTH - BOUNDARY_MARGIN - BOUNDARY_WIDTH,
        LEFT: BOUNDARY_MARGIN + BOUNDARY_WIDTH
      },
      STATUS = {
        NEW_GAME: 'NEW_GAME',
        SERVING: 'SERVING',
        PLAYING: 'PLAYING',
        GAME_OVER: 'GAME_OVER'
      },
      DEFAULT_BALL_SETTINGS = {
        x: CANVAS_WIDTH / 2 - BALL_SIZE / 2,
        y: FIELD.TOP + 1,
        vector: {
          x: 1,
          y: -1,
          velocity: 3
        }
      },
      DEFAULT_STATE = {
        status: STATUS.NEW_GAME,
        left: {
          paddle: {
            x: FIELD.LEFT + BALL_SIZE,
            y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2
          },
          input: { keyPressed: null },
          score: 0
        },
        right: {
          paddle: { 
            x: FIELD.RIGHT - BALL_SIZE - PADDLE_WIDTH,
            y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2 
          },
          input: { keyPressed: null },
          score: 0
        },
        ball: clone(DEFAULT_BALL_SETTINGS)
      },
      $canvas = $('<canvas width="' + CANVAS_WIDTH + '" height="' + CANVAS_HEIGHT + '"></canvas>'),
      canvas = $canvas.get(0).getContext('2d'),
      gameLoopId = null,
      state = null;
      
  $canvas.appendTo('#game');
  
  // capture user input
  $(document).keydown(function (e) {
    switch (e.which) {
      case KEY_CODES.LEFT_UP:
        state.left.input.keyPressed = KEY_CODES.LEFT_UP; 
        break; 
      case KEY_CODES.LEFT_DOWN:
        state.left.input.keyPressed = KEY_CODES.LEFT_DOWN;
        break; 
      case KEY_CODES.RIGHT_UP:
        state.right.input.keyPressed = KEY_CODES.RIGHT_UP;
        break;
      case KEY_CODES.RIGHT_DOWN:
        state.right.input.keyPressed = KEY_CODES.RIGHT_DOWN;
        break; 
    }
  });

  $(document).keyup(function (e) {
    switch (e.which) {
      case KEY_CODES.LEFT_UP:
      case KEY_CODES.LEFT_DOWN:
        state.left.input.keyPressed = null; 
        break; 
      case KEY_CODES.RIGHT_UP:
      case KEY_CODES.RIGHT_DOWN:
        state.right.input.keyPressed = null;
        break;
      case KEY_CODES.SPACE:
        switch(state.status) {
          case STATUS.NEW_GAME:
          case STATUS.SERVING:
            state.status = STATUS.PLAYING;  
            break;
          case STATUS.GAME_OVER:
            startGameLoop();
            break;
        }
        break;
    }
  });

  startGameLoop();
  
  function startGameLoop () {
    resetState();

    // game loop
    gameLoopId = setInterval(function () {
      update();
      draw();
    }, 1000/FPS);
  }
  
  //
  // UPDATE
  //
  
  function update () {
    updatePaddle(state.left.paddle, state.left.input.keyPressed, KEY_CODES.LEFT_UP, KEY_CODES.LEFT_DOWN);
    updatePaddle(state.right.paddle, state.right.input.keyPressed, KEY_CODES.RIGHT_UP, KEY_CODES.RIGHT_DOWN);
    updateBall();
    updateWinner();
  }
  
  function updatePaddle(paddle, keyCode, upKeyCode, downKeyCode) {
    if (keyCode !== null) {
      switch (keyCode) {
        case downKeyCode:
          paddle.y = (paddle.y + PADDLE_MOVE_INTERVAL + PADDLE_HEIGHT > FIELD.BOTTOM)
            ? paddle.y = FIELD.BOTTOM - PADDLE_HEIGHT
            : paddle.y = paddle.y + PADDLE_MOVE_INTERVAL; 
          break;
        case upKeyCode:
          paddle.y = (paddle.y - PADDLE_MOVE_INTERVAL < FIELD.TOP)
            ? paddle.y = FIELD.TOP
            : paddle.y = paddle.y - PADDLE_MOVE_INTERVAL;
          break;
      } 
    }
  }
  
  function updateBall () {
    if (state.status === STATUS.PLAYING) {
      handleBallCollision();
      state.ball.x += state.ball.vector.x * state.ball.vector.velocity;
      state.ball.y += state.ball.vector.y * state.ball.vector.velocity;
    }
  }
  
  function updateWinner () {
    if (state.left.score === 5 || state.right.score == 5) {
      state.status = STATUS.GAME_OVER;
      clearInterval(gameLoopId);
    }
  }
  
  //
  // DRAW
  //
  
  function draw () {
    canvas.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    drawBoundaries();
    drawPaddles();
    drawBall();
    drawScore();
    drawNewGameMessage();
    drawServeMessage();
    drawWinnerMessage();
  }
  
  function drawBoundaries () {
    // draw field walls
    canvas.fillStyle = 'white';
    canvas.fillRect(
      BOUNDARY_MARGIN, 
      BOUNDARY_MARGIN, 
      CANVAS_WIDTH - BOUNDARY_MARGIN * 2, 
      CANVAS_HEIGHT - BOUNDARY_MARGIN * 2
    );
    
    // fill field
    canvas.fillStyle = 'black';
    canvas.fillRect(
      BOUNDARY_MARGIN + BOUNDARY_WIDTH, 
      BOUNDARY_MARGIN + BOUNDARY_WIDTH, 
      CANVAS_WIDTH - ((BOUNDARY_MARGIN + BOUNDARY_WIDTH) * 2), 
      CANVAS_HEIGHT - ((BOUNDARY_MARGIN + BOUNDARY_WIDTH) * 2)
    );
    
    // draw center line
    canvas.fillStyle = 'gray';
    canvas.fillRect(
      CANVAS_WIDTH / 2 - BOUNDARY_WIDTH / 2, 
      FIELD.TOP, 
      BOUNDARY_WIDTH, 
      FIELD.BOTTOM - BOUNDARY_MARGIN - BOUNDARY_WIDTH
    );
  }
  
  function drawPaddles () {
    canvas.fillStyle = 'white';
    
    // left paddle
    canvas.fillRect(
      state.left.paddle.x,
      state.left.paddle.y,
      PADDLE_WIDTH,
      PADDLE_HEIGHT 
    );
    
    // right paddle
    canvas.fillRect(
      state.right.paddle.x,
      state.right.paddle.y,
      PADDLE_WIDTH,
      PADDLE_HEIGHT 
    );
  }
  
  function drawBall () {
    if (state.status === STATUS.PLAYING) {
      canvas.fillStyle = 'white';
      canvas.fillRect(
        state.ball.x,
        state.ball.y,
        BALL_SIZE,
        BALL_SIZE 
      );
    }
  }
  
  function drawScore () {
    canvas.fillStyle = 'white';
    canvas.font = "48px courier";

    var MARGIN = 20,
        TEXT_BOTTOM = FIELD.BOTTOM - MARGIN, 
        LEFT_TEXT_WIDTH = canvas.measureText(state.left.score).width;
    
    canvas.fillText(
      state.left.score, 
      CANVAS_WIDTH / 2 - MARGIN - LEFT_TEXT_WIDTH, 
      TEXT_BOTTOM
    );
    canvas.fillText(
      state.right.score, 
      CANVAS_WIDTH / 2 + MARGIN, 
      TEXT_BOTTOM
    );
  }
  
  function drawNewGameMessage () {
    if (state.status === STATUS.NEW_GAME) {
      canvas.fillStyle = 'white';
      canvas.font = "48px courier";
      
      // draw title
      var winText = 'PONG',
          winTextWidth = canvas.measureText(winText).width,
          winTextHeight = getTextHeight(canvas.font).height;
            
      canvas.fillText(
        winText, 
        CANVAS_WIDTH / 2 - winTextWidth / 2, 
        CANVAS_HEIGHT / 2 - winTextHeight / 2
      );
      
      // draw start game message
      canvas.font = "18px courier";
      var newGameText = 'Press SPACE to serve the ball',
          newGameTextWidth = canvas.measureText(newGameText).width,
          newGameTextHeight = getTextHeight(canvas.font).height;
      
      canvas.fillText(
        newGameText, 
        CANVAS_WIDTH / 2 - newGameTextWidth / 2, 
        CANVAS_HEIGHT / 2 + winTextHeight + 20
      );
      
      // draw controls message
      canvas.font = "12px courier";
      var playerOneControlsText = 'Player 1 Controls - w: paddle up, s: paddle down',
          playerOneControlsTextWidth = canvas.measureText(playerOneControlsText).width,
          playerOneControlsTextHeight = getTextHeight(canvas.font).height;
      
      canvas.fillText(
        playerOneControlsText, 
        CANVAS_WIDTH / 2 - playerOneControlsTextWidth / 2, 
        CANVAS_HEIGHT / 2 + winTextHeight + newGameTextHeight + 40
      );
      
      var playerTwoControlsText = 'Player 2 Controls - up arrow: paddle up, down arrow: paddle down',
          playerTwoControlsTextWidth = canvas.measureText(playerTwoControlsText).width;
      
      canvas.fillText(
        playerTwoControlsText, 
        CANVAS_WIDTH / 2 - playerTwoControlsTextWidth / 2, 
        CANVAS_HEIGHT / 2 + winTextHeight + newGameTextHeight + playerOneControlsTextHeight + 40
      );
    }
  }
  
  function drawServeMessage () {
    if (state.status === STATUS.SERVING) {
      canvas.fillStyle = 'white';
      canvas.font = "18px courier";
      
      var serveText = 'Press SPACE to serve the ball',
          serveTextWidth = canvas.measureText(serveText).width,
          serveTextHeight = getTextHeight(canvas.font).height;
            
      canvas.fillText(
        serveText, 
        CANVAS_WIDTH / 2 - serveTextWidth / 2, 
        CANVAS_HEIGHT / 2 - serveTextHeight / 2
      );
    }
  }
  
  function drawWinnerMessage() {
    if (state.status === STATUS.GAME_OVER) {
      canvas.fillStyle = 'white';
      canvas.font = "48px courier";
      
      // draw winning player message
      var winText = 'Player ' + (state.left.score === 5 ? '1' : '2') + ' wins',
          winTextWidth = canvas.measureText(winText).width,
          winTextHeight = getTextHeight(canvas.font).height;
            
      canvas.fillText(
        winText, 
        CANVAS_WIDTH / 2 - winTextWidth / 2, 
        CANVAS_HEIGHT / 2 - winTextHeight / 2
      );
      
      // draw new game message 
      canvas.font = "18px courier";
      var newGameText = 'Press SPACE to start a new game',
          newGameTextWidth = canvas.measureText(newGameText).width;
      
      canvas.fillText(
        newGameText, 
        CANVAS_WIDTH / 2 - newGameTextWidth / 2, 
        CANVAS_HEIGHT / 2 + winTextHeight + 20
      );
    }
  }
  
  //
  // PHYSICS
  //
  
  function handleBallCollision () {
    var ballBoundaries = getBoundaries(state.ball, BALL_SIZE, BALL_SIZE),
        leftPaddleBoundaries = getBoundaries(state.left.paddle, PADDLE_WIDTH, PADDLE_HEIGHT),
        rightPaddleBoundaries = getBoundaries(state.right.paddle, PADDLE_WIDTH, PADDLE_HEIGHT);
        
    // detect left paddle collision
    detectPaddleCollision(
      ballBoundaries.left,
      leftPaddleBoundaries.right, 
      leftPaddleBoundaries,
      ballBoundaries,
      state.left.input.keyPressed,
      KEY_CODES.LEFT_DOWN,
      KEY_CODES.LEFT_UP
    );
    
    // detect right paddle collision
    detectPaddleCollision(
      rightPaddleBoundaries.left,
      ballBoundaries.right, 
      rightPaddleBoundaries,
      ballBoundaries,
      state.right.input.keyPressed,
      KEY_CODES.RIGHT_DOWN,
      KEY_CODES.RIGHT_UP
    );
    
    // detect bounce wall collision
    if (ballBoundaries.top < FIELD.TOP || ballBoundaries.bottom > FIELD.BOTTOM) {
      state.ball.vector.y = state.ball.vector.y * -1;
    }
    
    // detect goal collision
    if (ballBoundaries.left < FIELD.LEFT || ballBoundaries.right > FIELD.RIGHT) {
      // end turn
      state.status = STATUS.SERVING;
            
      // increase score for the player who scored the goal
      if (ballBoundaries.right > FIELD.RIGHT) {
        state.left.score++;
        resetBall(1);
      } else {
        state.right.score++;
        resetBall(-1);
      }
    }
  }
  
  function detectPaddleCollision (
    leftBoundary, 
    rightBoundary, 
    paddleBoundaries, 
    ballBoundaries,
    activeKeyCode,
    downKeyCode,
    upKeyCode
  ) {
    // determine if the ball is colliding with the paddle
    if (
      leftBoundary <= rightBoundary
      && (
        (
          ballBoundaries.bottom >= paddleBoundaries.top
          && ballBoundaries.bottom <= paddleBoundaries.bottom
        ) 
        || (
          ballBoundaries.top <= paddleBoundaries.bottom
          && ballBoundaries.top >= paddleBoundaries.top
        )
      )
    ) {
      // if the paddle is moving
      if (activeKeyCode) { 
        if (activeKeyCode == downKeyCode) {
          // pass true to increase velocity if paddle and ball moving in same direction. 
          setVelocity(state.ball.vector.y > 0);
        } else if (activeKeyCode == upKeyCode) {
          // pass true to increase velocity if paddle and ball moving in same direction. 
          setVelocity(state.ball.vector.y < 0);  
        }
      }
      
      // change ball direction
      state.ball.vector.x = state.ball.vector.x * -1;
    }
  }
  
  function getBoundaries (point, width, height) {
    // get the boundaries of a rectangular body
    return {
      top: point.y,
      bottom: point.y + height,
      left: point.x,
      right: point.x + width
    };
  }
  
  //
  // UTILS
  //
  
  function resetState () {
    state = clone(DEFAULT_STATE);  
  }
  
  function resetBall (x) {
    state.ball = clone(DEFAULT_BALL_SETTINGS);
    state.ball.vector.x = x;
  }
  
  function setVelocity (increaseVelocity) {
    state.ball.vector.velocity = (increaseVelocity)
      ? Math.min(MAX_BALL_VELOCITY, state.ball.vector.velocity + VELOCITY_STEP)
      : Math.max(MIN_BALL_VELOCITY, state.ball.vector.velocity - VELOCITY_STEP);
  }
  
  function clone (o) {
    return JSON.parse(JSON.stringify(o));
  }
  
  function getTextHeight (font) {
    var $text = $('<span>Hg</span>').css({ fontFamily: font }),
        $block = $('<div style="display: inline-block; width: 1px; height: 0px;"></div>'),
        $div = $('<div></div>'),
        $body = $('body');
  
    $div.append($text,$block);
    $body.append($div);
  
    try {
  
      var result = {};
  
      $block.css({ verticalAlign: 'baseline' });
      result.ascent = $block.offset().top - $text.offset().top;
  
      $block.css({ verticalAlign: 'bottom' });
      result.height = $block.offset().top - $text.offset().top;
  
      result.descent = result.height - result.ascent;
  
    } finally {
      $div.remove();
    }
  
    return result;
  }
});
