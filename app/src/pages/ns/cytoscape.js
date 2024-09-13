const styleObj = {
  style: [
    {
      selector: 'node',
      style: {
        'background-color': '#2b65ec',
        label: 'data(id)',
        'text-valign': 'center',
        'text-halign': 'center',
        'text-outline-color': '#2b65ec',
        'text-outline-width': '1px',
        'font-weight': 150,
        color: '#ffffff',
        width: 'data(width)',
        height: 'data(height)'
      }
    },
    {
      selector: 'edge',
      style: {
        width: 1,
        'line-color': '#08233c',
        'target-arrow-color': '#08233c',
        'curve-style': 'bezier',
        'target-arrow-shape': 'chevron',
        label: 'data(description)', // Display the edge description
        'font-size': 14, // Adjust the font size for the description label
        'text-rotation': 'autorotate', // Ensure the label follows the edge line
        color: '#000'
      }
    },
    {
      selector: 'node:selected',
      style: {
        'background-color': '#F08080',
        'border-color': 'red'
      }
    },
    {
      selector: 'edge:selected',
      style: {
        'line-color': '#F08080',
        'target-arrow-color': '#F08080'
      }
    }
  ]
}

const fcoseLayout = {
  name: 'fcose',
  fit: true,
  padding: 10,
  animate: false, // Enable animation
  randomize: true, // Randomize initial positions
  nodeDimensionsIncludeLabels: true, // Include node labels in dimension calculations
  idealEdgeLength: 1000, // Ideal length of edges
  edgeElasticity: 0.5, // Elasticity of edges
  nestingFactor: 0.3, // Factor for nesting of compound nodes
  gravity: 0.5 // Gravity to pull nodes towards center
}

const modifiedLayout = {
  name: 'dagre',
  fit: true, // Fit the viewport to the graph
  padding: 10, // Padding around the graph
  animate: true, // Disable animation
  nodeDimensionsIncludeLabels: true, // Include labels in the layout dimensions
  rankDir: 'BT', // Direction of the tree (TB = Top to Bottom, LR = Left to Right)
  rankSep: 100, // Vertical separation between nodes
  edgeSep: 50, // Separation between edges
  nodeSep: 50 // Separation between nodes
}

export { styleObj, fcoseLayout, modifiedLayout }
