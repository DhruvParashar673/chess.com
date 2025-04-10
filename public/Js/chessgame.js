document.addEventListener("DOMContentLoaded", () => {
  const socket = io();
  const chess = new Chess();
  const boardElement = document.querySelector(".chessboard");

  let draggedPiece = null;
  let sourceSquare = null;
  let playerRole = null;

  const getPieceUnicode = (type, color) => {
    const pieces = {
      p: { w: "♙", b: "♟︎" },
      r: { w: "♖", b: "♜" },
      n: { w: "♘", b: "♞" },
      b: { w: "♗", b: "♝" },
      q: { w: "♕", b: "♛" },
      k: { w: "♔", b: "♚" },
    };
    return pieces[type][color];
  };

  const handleMove = (source, target) => {
    const from = `${String.fromCharCode(97 + source.col)}${8 - source.row}`;
    const to = `${String.fromCharCode(97 + target.col)}${8 - target.row}`;

    const movingPiece = chess.get(from);
    const isPromotion =
      movingPiece &&
      movingPiece.type === "p" &&
      ((movingPiece.color === "w" && to[1] === "8") ||
        (movingPiece.color === "b" && to[1] === "1"));

    const move = isPromotion ? { from, to, promotion: "q" } : { from, to };

    socket.emit("move", move);
  };

  const renderBoard = () => {
    const board = chess.board();
    boardElement.innerHTML = "";

    board.forEach((row, rowIndex) => {
      row.forEach((square, colIndex) => {
        const squareEl = document.createElement("div");
        squareEl.classList.add(
          "square",
          (rowIndex + colIndex) % 2 === 0 ? "white" : "black"
        );
        squareEl.dataset.row = rowIndex;
        squareEl.dataset.col = colIndex;

        if (square) {
          const piece = document.createElement("div");
          piece.classList.add(
            "piece",
            square.color === "w" ? "white" : "black"
          );
          piece.textContent = getPieceUnicode(square.type, square.color);
          piece.draggable = playerRole === square.color;

          piece.addEventListener("dragstart", (e) => {
            if (piece.draggable) {
              draggedPiece = piece;
              sourceSquare = { row: rowIndex, col: colIndex };
              e.dataTransfer.setData("text/plain", "");
            }
          });

          piece.addEventListener("dragend", () => {
            draggedPiece = null;
            sourceSquare = null;
          });

          squareEl.appendChild(piece);
        }

        squareEl.addEventListener("dragover", (e) => e.preventDefault());

        squareEl.addEventListener("drop", (e) => {
          e.preventDefault();
          if (!draggedPiece) return;

          const targetSquare = {
            row: parseInt(squareEl.dataset.row),
            col: parseInt(squareEl.dataset.col),
          };

          handleMove(sourceSquare, targetSquare);
        });

        boardElement.appendChild(squareEl);
      });
    });
  };

  socket.on("playerRole", (role) => {
    playerRole = role;
    renderBoard();
  });

  socket.on("spectatorRole", () => {
    playerRole = null;
    renderBoard();
  });

  socket.on("boardState", (fen) => {
    chess.load(fen);
    renderBoard();
  });

  socket.on("moveMade", (move) => {
    chess.move(move);
    renderBoard();
  });

  renderBoard();
});
