// Fix "perf death by a thousand cuts"
// http://localhost:3000/isolated/exercise/06.js

import * as React from 'react'
import {
  useForceRerender,
  useDebouncedState,
  AppGrid,
  updateGridState,
  updateGridCellState,
} from '../utils'

const GridStateContext = React.createContext()
const GridDispatchContext = React.createContext()

const DogNameContext = React.createContext()
const SetDogNameContext = React.createContext()

const initialGrid = Array.from({length: 100}, () =>
  Array.from({length: 100}, () => Math.random() * 100),
)

function gridReducer(state, action) {
  switch (action.type) {
    case 'UPDATE_GRID_CELL': {
      return {...state, grid: updateGridCellState(state.grid, action)}
    }
    case 'UPDATE_GRID': {
      return {...state, grid: updateGridState(state.grid)}
    }
    default: {
      throw new Error(`Unhandled action type: ${action.type}`)
    }
  }
}

function GridProvider({children}) {
  const [grid, gridDispatch] = React.useReducer(gridReducer, {
    grid: initialGrid,
  })
  return (
    <GridStateContext.Provider value={grid}>
      <GridDispatchContext.Provider value={gridDispatch}>
        {children}
      </GridDispatchContext.Provider>
    </GridStateContext.Provider>
  )
}

function useGridState() {
  const context = React.useContext(GridStateContext)
  if (!context) {
    throw new Error('useGridState must be used within the AppProvider')
  }
  return context
}

function useGridDispatch() {
  const context = React.useContext(GridDispatchContext)
  if (!context) {
    throw new Error('useGridDispatch must be used within the AppProvider')
  }
  return context
}

function DogNameProvider({children}) {
  const [dogName, setDogName] = React.useState('')
  return (
    <DogNameContext.Provider value={dogName}>
      <SetDogNameContext.Provider value={setDogName}>
        {children}
      </SetDogNameContext.Provider>
    </DogNameContext.Provider>
  )
}

function useDogName() {
  const context = React.useContext(DogNameContext)
  if (context === undefined) {
    throw new Error('useDogName must be used within the AppProvider')
  }
  return context
}

function useSetDogName() {
  const context = React.useContext(SetDogNameContext)
  if (!context) {
    throw new Error('useSetDogName must be used within the AppProvider')
  }
  return context
}

function Grid() {
  const dispatch = useGridDispatch()
  const [rows, setRows] = useDebouncedState(50)
  const [columns, setColumns] = useDebouncedState(50)
  const updateGridData = () => dispatch({type: 'UPDATE_GRID'})
  return (
    <AppGrid
      onUpdateGrid={updateGridData}
      rows={rows}
      handleRowsChange={setRows}
      columns={columns}
      handleColumnsChange={setColumns}
      Cell={Cell}
    />
  )
}
Grid = React.memo(Grid)

function withStateSlice(Component, slice) {
  const MemoComp = React.memo(Component)
  function Wrapper(props, ref) {
    const state = useGridState()
    return <MemoComp state={slice(state, props)} {...props} ref={ref} />
  }
  Wrapper.displayName = `withStateSlice(${
    Component.displayName || Component.name
  })`
  return React.memo(React.forwardRef(Wrapper))
}

function Cell({state: cell, row, column}) {
  const dispatch = useGridDispatch()
  const handleClick = () => dispatch({type: 'UPDATE_GRID_CELL', row, column})
  return (
    <button
      className="cell"
      onClick={handleClick}
      style={{
        color: cell > 50 ? 'white' : 'black',
        backgroundColor: `rgba(0, 0, 0, ${cell / 100})`,
      }}
    >
      {Math.floor(cell)}
    </button>
  )
}
Cell = withStateSlice(Cell, (state, {row, column}) => state.grid[row][column])

function DogNameInput() {
  const dogName = useDogName()
  const setDogName = useSetDogName()

  function handleChange(event) {
    const newDogName = event.target.value
    setDogName(newDogName)
  }

  return (
    <form onSubmit={e => e.preventDefault()}>
      <label htmlFor="dogName">Dog Name</label>
      <input
        value={dogName}
        onChange={handleChange}
        id="dogName"
        placeholder="Toto"
      />
      {dogName ? (
        <div>
          <strong>{dogName}</strong>, I've a feeling we're not in Kansas anymore
        </div>
      ) : null}
    </form>
  )
}
function App() {
  const forceRerender = useForceRerender()
  return (
    <div className="grid-app">
      <button onClick={forceRerender}>force rerender</button>
      <div>
        <DogNameProvider>
          <DogNameInput />
        </DogNameProvider>
        <GridProvider>
          <Grid />
        </GridProvider>
      </div>
    </div>
  )
}

export default App

/*
eslint
  no-func-assign: 0,
*/
