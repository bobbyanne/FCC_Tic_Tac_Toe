/**
 * @param {string} [selector]
 */
function TicTacToeBoard(selector) {
    this.$board = $(selector || ".board-piece");
    this.$board.data("board", this);
    this.curPiece = "X";
    this.playerPiece = "X";
    this.playerColor = "#FFB300";
    this.playerScore = 0;
    this.computerScore = 0;
    this.computerPiece = "O";
    this.difficulty = "easy";
    this.movesMade = 0;
    this.isGameOver = true;
    this.canvas = document.getElementById("tic-tac-toe-canvas");
    this.ctx = this.canvas.getContext("2d");

    this.init();
}

TicTacToeBoard.prototype.init = function () {
    this.clearBoard();
    this.enableClicks();
    this.showTurn();
    this.ctx.strokeStyle = "#42A3F4";
    this.ctx.lineWidth = 5;
    this.ctx.lineCap = 'round';
};

TicTacToeBoard.prototype.reset = function () {
    this.isGameOver = false;
    this.curPiece = "X";
    this.ctx.clearRect(0, 0, 256, 256);
    this.movesMade = 0;
    this.clearBoard();
};

TicTacToeBoard.prototype.changePlayerPiece = function (newPiece) {
    if (newPiece === "X") {
        this.playerPiece = "X";
        this.computerPiece = "O";
    } else {
        this.playerPiece = "O";
        this.computerPiece = "X";
    }
    this.showTurn();
};

TicTacToeBoard.prototype.enableClicks = function () {
    this.isGameOver = false;
    this.$board.unbind("click").click(function () {
        var $this = $(this);
        var board = $this.data("board");
        if (board.isGameOver) {
            board.disableClicks();
            return;
        }
        board.setPosValue($this, board.curPiece);
    });
};

TicTacToeBoard.prototype.disableClicks = function () {
    this.$board.off("click");
};

TicTacToeBoard.prototype.clearBoard = function () {
    this.enableClicks();
    this.$board.removeData("piece");
    this.$board.find("tspan").each(function () {
        $(this).text("");
    });
};

TicTacToeBoard.prototype.getAvailableMoves = function () {
    return this.$board.filter(function () {
        if ($(this).data("piece") === undefined)
            return $(this);
    });
};

TicTacToeBoard.prototype.aiMakeRandMove = function (available) {
    var randomPiece = available.eq(Math.floor(Math.random() * available.length));
    this.setPosValue(randomPiece, this.computerPiece);
};

TicTacToeBoard.prototype.aiGetCorners = function () {
    var available = this.getAvailableMoves();
    return available.filter(function () {
        if (["00", "02", "20", "22"].indexOf($(this).attr("id")) > -1)
            return $(this);
    });
};

TicTacToeBoard.prototype.aiGetCenter = function () {
    var available = this.getAvailableMoves();
    return available.filter(function () {
        if (["11"].indexOf($(this).attr("id")) > -1)
            return $(this);
    });
};

/**
 * @param {JQuery } $piece - Piece ID
 * @param {String} value 
 */
TicTacToeBoard.prototype.setPosValue = function ($piece, value) {
    // In the data object of the $piece (JQuery) object resides a reference
    // to a "piece", meaning it could have a X or O associated with this piece.
    if ($piece.data("piece") === undefined) {
        var playerColor = this.playerColor;
        if (this.curPiece === this.computerPiece) // you could change the computers color here
            playerColor = "#FDE74E";
        $piece.data({ "piece": value });  // Set the data to the parameter of "value" (X or O)
        var snap = Snap($piece.find("svg")[0]);
        snap.text(20, 40, [value]);
        var txt = $piece.find("tspan");
        $(txt).css({
            'font-size': 42,
            fill: 'none',
            stroke: playerColor,
            'stroke-dasharray': 200,
            'stroke-dashoffset': 200,
        });
        txt.stop(true, true).animate({ // This simulates a drawing effect
            'stroke-dashoffset': 0,
        }, 200, function () {
            $(this).css('fill', playerColor);
        });
        this.checkWinner();
        this.changeTurn();
        this.movesMade += 1;
        return true;
        // We were able to move to this location so send back a comfrimation.
    }
    return false;
};

TicTacToeBoard.prototype.aiMove = function () {
    var boardCopy = this.getAvailableMoves();

    if (!boardCopy.length)  // If no moves are available then we can't move
        return;

    // This allows the user to click again.  NOTE: This could be in a better
    // location, if the CPU is slow, then the user could sneak in an extra move.
    this.enableClicks();

    this.isGameOver = false;  // I'm not sure why this is here, but I'm scarred to move it.
    var game = this.$board.data("board");  // Refrence to out TicTacToe object.
    game.difficulty = $("#difficulty").find(":selected").text().toLowerCase();
    var bestMove = null;

    if (game.difficulty === "easy") {
        game.aiMakeRandMove(game.getAvailableMoves());
        return;
    }

    for (var i = 0; i < boardCopy.length; i++) {
        var $this = boardCopy.eq(i);
        $this.data("piece", game.computerPiece);
        // checkWinner function also takes in a boolean arguement,
        // this boolean will let the fuction know that this is just 
        // a test and should not halt the game to show the winner.
        if (game.checkWinner(true) === game.computerPiece) {
            bestMove = $this;
            break; // We found our best move just now so break out of the loop.
        }

        $this.data('piece', game.playerPiece);
        if (game.checkWinner(true) === game.playerPiece) {
            // NOTE: We are not breaking out of the loop just because we saw
            // that the player could win.  The computer can possibly still have 
            // a winning move that has not been checked yet.
            bestMove = $this;
        }
        // We have to remove the "piece" data so that our setPosValue won't think
        // we are trying to overwrite an already played position.
        $this.removeData("piece");
    }

    if (bestMove) {
        game.setPosValue(bestMove.removeData("piece"), game.computerPiece);
        return;
    }

    var center = game.aiGetCenter();  // Center of the game board

    if (center.length) {
        game.setPosValue(center.removeData("piece"), game.computerPiece);
        return;
    }

    var corners = game.aiGetCorners();  // Get any available corners

    var random = Math.random();

    // This is for a random chance the computer will block the 1
    // weakness of this "AI" algorithm.
    if ((random > 0.60 || game.difficulty !== "medium") &&
        game.movesMade === 3) {
        if (game.$board.eq(0).data('piece') === game.playerPiece &&
            game.$board.eq(8).data('piece') === game.playerPiece) {
            game.setPosValue(game.$board.eq(1), game.computerPiece);
            return;
        }
        else if (game.$board.eq(2).data('piece') === game.playerPiece &&
            game.$board.eq(6).data('piece') === game.playerPiece) {
            game.setPosValue(game.$board.eq(3), game.computerPiece);
            return;
        }
    }

    if (corners.length) {
        game.aiMakeRandMove(corners);
        return;
    }

    // If nothing else make a random move.
    game.aiMakeRandMove(boardCopy);
};

TicTacToeBoard.prototype.updateScores = function () {
    $('#player-score').text("Player: " + this.playerScore);
    $('#computer-score').text("Computer: " + this.computerScore);
};

TicTacToeBoard.prototype.changeTurn = function () {
    this.curPiece = this.curPiece === "X" ? "O" : "X";
    this.showTurn();
    if (this.curPiece === this.computerPiece && !this.isGameOver) {
        this.disableClicks();  /* Don't let the player click until the computer
        has made it's move. */
        setTimeout($.proxy(this.aiMove, this), 600);
    }
};

TicTacToeBoard.prototype.showTurn = function () {
    // Get borders underneath the players score
    // We will be resizing the borders depending on 
    // who's turn it is.
    var playerBorder = $('#player-border');
    var computerBorder = $('#computer-border');
    if (this.curPiece === this.playerPiece) {
        computerBorder.stop(true, true).animate({
            width: 0
        }, 200);
        playerBorder.stop(true, true).animate({
            width: '120px'
        }, 200);
    }
    else {
        computerBorder.stop(true, true).animate({
            width: '120px'
        }, 200);
        playerBorder.stop(true, true).animate({
            width: '0'
        }, 200);
    }
};

TicTacToeBoard.prototype.drawEndGame = function ($from, $to) {
    var endGame = $('#end-game');
    var piece;
    var result = "";

    if ($from === undefined || $to === undefined) {
        piece = "X O";
        result = "Tie";
        // Tie
    }
    else {
        var self = this;
        piece = $from.data('piece');
        result = "";
        var game = $from.data('board');
        var startX = $from.position().left + 44;
        var startY = $from.position().top + 42;
        var endX = $to.position().left + 44;
        var endY = $to.position().top + 42;
        var amount = 0;
        var times = 0;

        if (piece == game.playerPiece) {
            result = "You Won";
        } else if (piece == game.computerPiece) {
            result = "Computer Won";
        }

        function step() {
            amount += 0.035;
            times += 1;
            if (times > 40)
                return;
            if (amount > 1) amount = 1;
            self.ctx.beginPath();
            self.ctx.clearRect(0, 0, 256, 256);
            self.ctx.moveTo(startX, startY);
            self.ctx.lineTo(startX + (endX - startX) * amount, startY + (endY - startY) * amount);
            self.ctx.stroke();

            window.requestAnimationFrame(step);
        }

        window.requestAnimationFrame(step);
    }

    setTimeout(function () {
        endGame.find('#results-container').html('<span class="result">' + result + '</span>');
        endGame.fadeIn(800).children().fadeIn(1200);
    }, 800);
};

TicTacToeBoard.prototype.checkWinner = function (testMove) {
    var foundEmpty = false;
    var winningPos = [[0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]];

    for (var i = 0; i < winningPos.length; i++) {
        var index = winningPos[i];
        var pos1 = this.$board.eq(index[0]).data("piece");
        var pos2 = this.$board.eq(index[1]).data("piece");
        var pos3 = this.$board.eq(index[2]).data("piece");

        if (pos1 === undefined || pos2 === undefined || pos3 === undefined) {
            foundEmpty = true;
            continue;
        }
        if (pos1 === pos2 && pos2 === pos3) {
            if (!testMove) {
                var a = this.$board.eq(index[0]);
                var b = this.$board.eq(index[2]);
                if (a.data('piece') === this.computerPiece) {
                    this.computerScore += 1;
                } else if (a.data('piece') === this.playerPiece) {
                    this.playerScore += 1;
                }
                this.updateScores();
                this.drawEndGame(a, b);
                this.disableClicks();
                this.isGameOver = true;
            }
            return pos1;
        }
    }
    if (!foundEmpty) {
        this.disableClicks();
        this.isGameOver = true;
        this.drawEndGame();
        return "tie";
    }

    return " ";
};

///////////////////// APP MANAGER //////////////////////

function AppManager(game) {
    this.game = game;
    this.formToggle = $("#form-header");
    this.formMain = $("#form-main");
    this.colorPickers = $(".custom-radio-btn");
    this.difficultyMenu = $("#difficulty").selectmenu({ width: 120 });
    this.yourPieceMenu = $("#your-piece");
    this.startGameBox = $("#start-game-box");
    this.startBtn = this.startGameBox.find("#start-btn");
    this.resetBtn = $("#reset-btn");

    this.init();
}

AppManager.prototype.init = function () {
    this.managePieceMenu();
    this.colorPickers.eq(2).data('checked', true).css('z-index', 2);
    this.enableColorPicker();

    this.formToggle.click(function () {
        var mainForm = $("#form-main");
        if (mainForm.css("display") === "none") {
            mainForm.slideDown();
            $(this).css({
                "border-bottom-left-radius": "0px",
                "border-bottom-right-radius": "0px"
            });
        }
        else {
            mainForm.slideUp();
            $(this).stop(true, true).animate({
                "border-bottom-left-radius": "3px",
                "border-bottom-right-radius": "3px"
            }, 800);
        }
    });

    $("#tic-tac-toe-table").click($.proxy(function () {
        if (this.getSelectedPiece() === "X" && this.menusEnabled())
            this.disableAllMenus();
        else {
            if (this.game.playerPiece === "O" &&
                this.game.getAvailableMoves().length === 9) {
                this.formMain.slideDown();
                this.startBtn.delay(300).effect("shake");
            }
        }
    }, this));

    this.resetBtn.click($.proxy(function () {
        this.game.reset();
        this.disableResetBtn();
        this.enableAllMenus();
    }, this));

    this.yourPieceMenu.selectmenu({
        width: 85,
        select: $.proxy(function (event, ui) {
            var app = this;
            var playerPiece = ui.item.label;
            app.managePieceMenu();
            app.game.changePlayerPiece(playerPiece);
        }, this)
    });
};

AppManager.prototype.getSelectedPiece = function () {
    return this.yourPieceMenu.find(":selected").text();
};

AppManager.prototype.menusEnabled = function () {
    return this.colorPickers.eq(0).css('left') === "0px";
};

AppManager.prototype.managePieceMenu = function () {
    if (this.getSelectedPiece() === "X") {
        this.disableStartBtn();
        this.game.enableClicks();
        this.game.changePlayerPiece(this.getSelectedPiece());
    } else {
        this.enableStartBtn();
        this.game.disableClicks();
        this.game.changePlayerPiece(this.getSelectedPiece());
    }
};

AppManager.prototype.enableColorPicker = function () {
    this.colorPickers.data('app', this);
    this.colorPickers.each(function (i) {
        $(this).animate({
            left: i * 22 + "%"
        });
    });
    this.colorPickers.off('hover').hover(function () {
        $(this).css({
            width: "20px",
            height: "20px",
            "box-shadow": "0px 3px 8px #222"
        });
    }, function () {
        $(this).data('app').colorPickers.each(function () {
            $(this).css({ // Scale all the radios back down
                "width": "15px",
                "height": "15px"
            });

            if ($(this).data('checked') === undefined) {
                $(this).css({
                    // if the radio is not checked then it gets no 
                    // box-shadow and change the z-index
                    'box-shadow': "none",
                    "z-index": 1
                });
            } else {
                $(this).css({
                    'box-shadow': '0px 0px 8px #000',
                    'z-index': 2
                });
            }
        });
    });

    this.colorPickers.unbind("click").click(function () {
        var $this = $(this);
        $this.parent().children().css("box-shadow", "none").removeData('checked');
        $this.data('checked', true);
        $this.css({
            "box-shadow": "0px 0px 10px #000",
            "z-index": 2
        });
        $this.stop(true, true).animate({
            width: 13,
            height: 13
        }, 25, function () {
            $(this).animate({
                width: 20,
                height: 20
            }, 50);
        });

        $this.data('app').game.playerColor = $this.attr('name');
    });
};  ////// enableColorPicker END //////////

AppManager.prototype.disableColorPicker = function () {
    this.colorPickers.off();
    this.colorPickers.animate({
        left: "45%",
    });
};

AppManager.prototype.disableAllMenus = function () {
    this.difficultyMenu.selectmenu('disable');
    this.yourPieceMenu.selectmenu('disable');
    this.disableColorPicker();
};

AppManager.prototype.enableAllMenus = function () {
    this.difficultyMenu.selectmenu('enable');
    this.yourPieceMenu.selectmenu('enable');
    this.enableColorPicker();
    this.managePieceMenu();
};

AppManager.prototype.enableStartBtn = function () {
    this.startGameBox.slideDown();
    this.startBtn.unbind("click").click($.proxy(function () {
        this.disableAllMenus();
        this.game.enableClicks();
        this.game.reset();
        this.game.aiMove();
        this.disableResetBtn();
        this.disableStartBtn();
    }, this));
};

AppManager.prototype.disableStartBtn = function () {
    this.startGameBox.slideUp();
    this.startBtn.unbind("click");
};

AppManager.prototype.disableResetBtn = function () {
    $('#end-game').fadeOut();
};


function Intro() {
    this.$yesBtn = $('#yesBtn');
    this.$nopeBtn = $('#nopeBtn');
    this.$introCredits = $('#credits');
    this.$introForm = $('#intro-form');
    this.$start = $('#start');
    this.audioTrack = null;
    this.loadingInterval = null;

    this.init();
}

Intro.prototype.init = function () {
    var self = this;
    this.headPhoneAnim();
    this.$yesBtn.click(function () {
        // Hide the form and show a Loading animation
        // Then play the song and play the intro animation
        self.loadingScreenAnim();
        self.downloadMusic('Sounds/TheMoth.mp3');
    });
    this.$nopeBtn.click(function () {
        // Just play the intro animation
        self.outroAnim();
    });
};

Intro.prototype.headPhoneAnim = function () {
    // Find the headphones in the DOM
    /* Animate the headphones falling down and bouncing then 
     * rolling to the center of the intro-form. */
    var self = this;
    var $headPhones = $('#headphonesImg');
    var newLeft = self.$introForm.width() / 2 - $headPhones.width();

    function spinAnim() {
        $headPhones.animateRotate(720, 1400);
    }

    function boxShadowAnim() {
        $headPhones.animateBoxShadow(4, 15, 8, 1000, 'easeOutBack');
    }

    $headPhones.animate({
        bottom: '0vh'
    }, 1000, "easeOutBounce", function () {
        setTimeout(spinAnim, 500);
        $(this).delay(500).animate({ left: newLeft + "px" }, 1400, function () {
            var newWidth = 64;
            setTimeout(boxShadowAnim, 400);
            $(this).delay(400).animate({
                top: -30 + 'px',
                width: newWidth,
                height: newWidth,
                left: self.$introForm.width() / 2 - newWidth / 1.5
            }, 1000, "easeOutBack");
        });
    });
};

Intro.prototype.downloadMusic = function (src) {
    var self = this;
    this.audioTrack = new Audio(src);

    this.audioTrack.addEventListener('loadeddata', function () {
        self.audioTrack.play();  // Enable after testing
        clearInterval(self.loadingInterval);
        $('#loading').fadeOut(1000);
        self.outroAnim();
    });
};

Intro.prototype.outroAnim = function () {
    var self = this;

    // Disable our intro-form.
    $('#intro-form').fadeOut(800);

    setTimeout(self.introAnim, 1000);  // Draw out TicTacToe
    self.$introCredits.children().delay(5000).each(function (i) {
        // Show each credit one at a time.
        $(this).delay(2000 * i).animate({
            opacity: 1
        }, 1500, function () {
            self.$introCredits.css('pointer-events', 'auto');
            self.$start.click(function () {
                $('#intro').fadeOut(1000);
                $('#game-name').animate({
                    top: '20px',
                }, 1000).animateScale(1, 1000);
            });
        });
    });
};

Intro.prototype.loadingScreenAnim = function () {
    var $loadingDiv = $('#loading');
    var loading1 = "Loading Music.";
    var loading2 = "Loading Music..";
    var loading3 = "Loading Music...";

    // Disable our intro-form.
    $('#intro-form').fadeOut(600);
    // Show our loading "animation".
    $loadingDiv.delay(600).fadeIn(1100);

    this.loadingInterval = setInterval(function () {
        if ($loadingDiv.text() === loading1) {
            $loadingDiv.text(loading2);
        } else if ($loadingDiv.text() === loading2) {
            $loadingDiv.text(loading3);
        } else {
            $loadingDiv.text(loading1);
        }
    }, 600);
};

Intro.prototype.introAnim = function () {
    var s = Snap('#game-name');
    var txt = s.text(5, 55, "Tic Tac Toe".split(""));

    $('tspan').css({
        'font-family': "High Tide - Demo",
        'font-size': 72,
        fill: 'none',
        stroke: '#00FEC8',
        'stroke-dasharray': 300,
        'stroke-dashoffset': 300
    });

    $('#game-name tspan').each(function (index) {
        $(this).stop(true, true).delay(300 * index).animate({
            'stroke-dashoffset': 0,
        }, 150, function () {
            $(this).css('fill', '#00FEC8');
        });
    });
};

/********************** JQUERY PLUGINS ***********************/
//  Special thanks to yckart and the stackoverflow community.
//  I'm expanding on a answer given by yckart from the post,
//  https://stackoverflow.com/questions/15191058/css-rotation-cross-browser-with-jquery-animate

$.fn.animateScale = function (endScale, duration, easing, complete) {
    return this.each(function () {
        var $this = $(this);
        var currentScale = 2;
        if (window.innerWidth < 400) {
            currentScale = 1;
            endScale = 0.8;
        }

        $({ scale: currentScale }).animate({ scale: endScale }, {
            duration: duration,
            easing: easing,
            step: function (now) {
                $this.css({
                    transform: 'scale(' + now + ')'
                });
            },
            complete: complete || $.noop
        });
    });
};

$.fn.animateRotate = function (end, duration, easing, complete) {
    return this.each(function () {
        var $this = $(this);

        $({ rotate: 0 }).animate({ rotate: end }, {
            duration: duration,
            easing: easing,
            step: function (now) {
                $this.css({
                    transform: 'rotate(' + now + 'deg)'
                });
            },
            complete: complete || $.noop
        });
    });
};


$.fn.animateBoxShadow = function (endX, endY, endSpread, duration, easing, complete) {
    return this.each(function () {
        var $this = $(this);
        var x = 0;
        var y = 0;
        var spread = 0;

        $({ x: 0, y: 0, spread: 0 }).animate({ x: endX, y: endY, spread: endSpread }, {
            duration: duration,
            easing: easing,
            step: function (now) {
                var obj = arguments[1];
                if (obj.prop === 'spread')
                    spread = now;
                else if (obj.prop === 'x')
                    x = now;
                else if (obj.prop === 'y')
                    y = now;
                else
                    throw TypeError("You suck at programming");
                $this.css({
                    'box-shadow': x + 'px ' + y + 'px ' + spread + 'px #111'
                });
            },
            complete: complete
        });
    });
};


/*********************** END PLUGINS *************************/

$(function () {  /////////////////////// MAIN \\\\\\\\\\\\\\\\\\\\\\\\\
    var intro = new Intro();

    var ticTacToe = new TicTacToeBoard();
    var app = new AppManager(ticTacToe);

    $(window).resize(function() {
        var $introForm = $('#intro-form');
        var $headphones = $('#headphonesImg');

        if ($headphones.css('display') !== 'none') {
            $headphones.css('left', $introForm.width() / 2 - $headphones.width() / 1.6);
        }
    });
});
