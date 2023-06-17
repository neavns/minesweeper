let _ROWS_ = 10
let _COLS_ = 10
let _BOMBS_ = 20
const _GRID_ = {}
let flagActive = false
let shortcutsEnabled = false
let highlighterEnabled = false
let wallhackEnabled = false

// ########################################
// MAIN FUNCTIONS
// ########################################

const createCell = ({ x, y, isBomb = false, isRevealed = false, isFlagged = false, adjacentBombs = 0 }) => {
  return {
    x,
    y,
    isBomb,
    isRevealed,
    isFlagged,
    adjacentBombs
  };
}
const populateGrid = () => {
  const bombs = generateBombs()
  for (let x = 0; x < _ROWS_; x++) {
    for (let y = 0; y < _COLS_; y++) {
      const key = toKey(x, y)
      const isBomb = bombs.includes(key)
      const adjacentBombs = getAdjacentBombs({ x, y }, bombs)
      _GRID_[key] = createCell({ x, y, isBomb, adjacentBombs })
    }
  }
}
const revealCell = cell => {
  if (flagActive) {
    flagCell(cell)
    return
  }
  if (cell.isRevealed || cell.isFlagged) return
  _GRID_[`${cell.x}-${cell.y}`].isRevealed = true
  if(cell.isBomb) {
    clearHelpers()
    revealAll()
    gameOver()
    return
  }
  propagateReveal(cell)
  checkWin()
  updateGrid()
}
const renderGrid = () => {
  const grid = document.getElementById('grid')

  for(let x = 0; x < _ROWS_; x++) {
    const row = document.createElement('div')
    row.classList.add('row')
    for(let y = 0; y < _COLS_; y++) {
      const cell = _GRID_[toKey(x, y)]
      const cellElement = document.createElement('div')
      cellElement.classList.add('cell')
      cellElement.setAttribute('data-x', x)
      cellElement.setAttribute('data-y', y)
      cellElement.onclick = () => revealCell(cell)
      cellElement.onmousedown = toggleEmoji
      cellElement.onmouseup = toggleEmoji
      cellElement.onmouseover = () => onHover(cell)
      cellElement.onmouseleave = clearHelpers
      row.appendChild(cellElement)
    }
    grid.appendChild(row)

  }
}
const updateGrid = () => {
  for(let x = 0; x < _ROWS_; x++) {
    for(let y = 0; y < _COLS_; y++) {
      const { isRevealed, isBomb, adjacentBombs, isFlagged } = _GRID_[toKey(x, y)]
      const cellElement = getCellElement(x, y)
      cellElement.innerText = getCellText({ isRevealed, isBomb, adjacentBombs, isFlagged })

      if(isRevealed) {
        if (isFlagged) {
          cellElement.classList.add('flagged')
        }
        if (isBomb) {
          cellElement.classList.add(isBomb ? 'bomb' : '')
        } else {
          cellElement.classList.add('revealed', `b-${adjacentBombs}`)
        }
      }
    }
  }
}
const generateBombs = () => {
  let bombs = []
  for (let i = 0; i < _BOMBS_; i++) {
    const x = Math.floor(Math.random() * _ROWS_)
    const y = Math.floor(Math.random() * _COLS_)
    bombs.push(toKey(x, y))
  }
  return bombs
}
const revealAll = () => {
  for (let x = 0; x < _ROWS_; x++) {
    for (let y = 0; y < _COLS_; y++) {
      _GRID_[toKey(x, y)].isRevealed = true
    }
  }
  updateGrid()
}
const propagateReveal = (cell) => {
  if (cell.adjacentBombs > 0) return
  const neighbours = getNeighbours(cell)
  neighbours.forEach(n => {
    const neighbour = _GRID_[n]
    if (!neighbour || neighbour.isRevealed || neighbour.isBomb || neighbour.isFlagged) return
    revealCell(neighbour)
    propagateReveal(neighbour)
  })
}

// ########################################
// EVENT LISTENERS
// ########################################

const toggleHighlighter = () => {
  highlighterEnabled = !highlighterEnabled
  console.log('highlighterEnabled', highlighterEnabled)
  document.querySelector('#highlight').classList.toggle('active')
  clearHelpers()
}
const toggleWallhack = () => {
  wallhackEnabled = !wallhackEnabled
  console.log('wallhackEnabled', wallhackEnabled)
  document.querySelector('#wallhack').classList.toggle('active')
  clearHelpers()
}
const toggleEmoji = () => {
  const face = document.querySelector('#emoji')
  face.innerText = face.innerText === '🙂' ? '😲' : '🙂'
}
const onHover = (cell) => {
  clearHelpers()

  if (highlighterEnabled) {
    const neighbours = getNeighbours(cell)
    neighbours.forEach(n => {
      const [x, y] = n.split('-')
      const cellElement = getCellElement(x, y)
      !cellElement?.classList.contains('revealed') && cellElement?.classList.add('highlighted')
    })
  }

  if(wallhackEnabled) {
    const cellElement = document.querySelector(`[data-x="${cell.x}"][data-y="${cell.y}"]`)
    cellElement?.classList.add('wallhack')
    document.querySelector('.wallhack').innerText = getCellText({ ...cell, isRevealed: true })
  }
}
const toggleFlag = () => {
  flagActive = !flagActive
  document.querySelector('#flag').classList.toggle('active')
}

// ########################################
// HELPERS
// ########################################

const clearHelpers = () => {
  document.querySelectorAll('.highlighted').forEach(cell => cell.classList.remove('highlighted'))
  document.querySelectorAll('.wallhack').forEach(cell => {
    cell.classList.remove('wallhack')
    cell.innerText = ''
  })
}
const enableShortcuts = () => {
  if(shortcutsEnabled) return 
  document.addEventListener('keydown', e => {
    switch (e.key) {
      case 'r': reset(); break;
      case 'f': toggleFlag(); break;
      case 'q': revealAll(); break;
      case 'h': toggleHighlighter(); break;
      case 'w': toggleWallhack(); break;
      default: break;
    }
  })

  shortcutsEnabled = true
}
const reset = () => {
  document.getElementById('grid').innerHTML = ''
  document.querySelector('#emoji').innerText = '🙂'
  init()
}
const gameOver = (lost = true) => {
  document.querySelector('#emoji').innerText = lost ? '😵' : '🤩'
  document.querySelectorAll('.cell').forEach(cell => cell.removeEventListener('mousedown', toggleEmoji))
  document.querySelectorAll('.cell').forEach(cell => cell.removeEventListener('mouseup', toggleEmoji))
  document.querySelector('#status').innerText = lost ? '😵 Better luck next time!' : '🤩 Good Game! 🤩'
  document.querySelector('#grid').classList.add('disabled')
}
const checkWin = () => {
  const revealed = Object.values(_GRID_).filter(c => c.isRevealed)
  if (revealed.length === _ROWS_ * _COLS_ - _BOMBS_) {
    revealAll()
    gameOver(false)
  }
}
const setDifficulty = e => {
  const btn = e.target
  const difficulty = btn.getAttribute('data-difficulty')
  switch (difficulty) {
    case 'easy':
      _ROWS_ = 9
      _COLS_ = 9
      _BOMBS_ = 10
      break
    case 'medium':
      _ROWS_ = 16
      _COLS_ = 16
      _BOMBS_ = 40
      break
    case 'hard':
      _ROWS_ = 16
      _COLS_ = 30
      _BOMBS_ = 99
      break
  }

  document.querySelectorAll('.d-btn').forEach(b => b.classList.remove('d-active'))
  btn.classList.add('d-active')
  reset()
}
const toKey = (x, y) => `${x}-${y}`
const isInBounds = key => !/--/.test(key) && !key.startsWith('-')
const getNeighbours = ({ x, y }) => {
  const neighbours = [
    [x - 1, y - 1],
    [x - 1, y],
    [x - 1, y + 1],
    [x, y - 1],
    [x, y + 1],
    [x + 1, y - 1],
    [x + 1, y],
    [x + 1, y + 1]
  ]
    .map(([x, y]) => toKey(x, y))
    .filter(isInBounds)

  return neighbours
}
const flagCell = cell => {
  if (cell.isRevealed) return
  _GRID_[`${cell.x}-${cell.y}`].isFlagged = !_GRID_[`${cell.x}-${cell.y}`].isFlagged
  updateGrid()
}
const getAdjacentBombs = ({ x, y }, bombs) => {
  const neighbours = getNeighbours({ x, y })
  return neighbours.filter(n => bombs.includes(n)).length
}
const getCellText = ({ isRevealed, isBomb, adjacentBombs, isFlagged }) => {
  if (isFlagged && !isRevealed) return '🚩'
  if (!isRevealed) return ''
  if (isBomb) return '💣'
  return adjacentBombs || ''
}
const getCellElement = (x, y) => document.querySelector(`[data-x="${x}"][data-y="${y}"]`)

// ########################################
// START GAME
// ########################################

const init = () => {
  populateGrid()
  renderGrid()
  enableShortcuts()
  const controls = document.getElementById('controls')
  controls.style.width = document.getElementById('grid').clientWidth + 'px'
  document.querySelector('#mines').innerText = `Mines: ${_BOMBS_}`
  document.querySelectorAll('.d-btn').forEach(d => d.addEventListener('click', setDifficulty))
  document.querySelector('#status').innerText = ''
  document.querySelector('#grid').classList.remove('disabled')
}

init()